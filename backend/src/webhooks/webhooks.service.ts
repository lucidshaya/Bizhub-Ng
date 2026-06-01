import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { SmsWebhookDto } from './dto/sms-webhook.dto';

interface PosPayload {
  terminalId?: string;
  posId?: string;
  amount: number;
  reference?: string;
  trxRef?: string;
  status?: string;
  transactionStatus?: string;
  businessId?: string;
  mock?: boolean;
}

interface OpayPayload {
  accountNumber?: string;
  virtualAccountNumber?: string;
  amount: number;
  reference?: string;
  trxRef?: string;
  status?: string;
  mock?: boolean;
}

interface MonnifyPayload {
  eventType: string;
  eventData: {
    amountPaid: number;
    transactionReference: string;
    destinationAccountInformation?: {
      accountNumber: string;
    };
  };
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async processPosTransaction(payload: PosPayload) {
    const terminalId = payload.terminalId || payload.posId;
    const amount = payload.amount;
    const reference = payload.reference || payload.trxRef;
    const status = payload.status || payload.transactionStatus;

    if (!terminalId) {
      throw new Error('Missing terminalId or posId in webhook payload');
    }

    if (!amount || isNaN(amount)) {
      throw new Error('Missing or invalid amount');
    }

    let businessId = payload.businessId;

    if (!businessId) {
      this.logger.warn(
        `Webhook received without businessId. Searching for terminalId ${terminalId} is not fully implemented.`,
      );
      if (payload.mock) {
        const b = await this.prisma.business.findFirst();
        if (b) businessId = b.id;
      } else {
        throw new Error('Business mapping for terminal not found');
      }
    }

    if (!businessId) {
      throw new Error('Could not determine businessId');
    }

    let mappedStatus: TransactionStatus = TransactionStatus.PENDING;
    if (typeof status === 'string') {
      const s = status.toUpperCase();
      if (s === 'SUCCESS' || s === 'APPROVED' || s === '00') {
        mappedStatus = TransactionStatus.COMPLETED;
      } else if (s === 'FAILED' || s === 'DECLINED') {
        mappedStatus = TransactionStatus.FAILED;
      }
    }

    const mappedType = TransactionType.CREDIT;

    await this.transactionsService.create(businessId, {
      type: mappedType,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      description: `POS Payment via Terminal ${terminalId}`,
      channel: 'POS',
      reference: reference || `POS-${Date.now()}`,
      status: mappedStatus,
    });

    this.logger.log(
      `Successfully processed POS transaction ${reference} for Business ${businessId}`,
    );
  }

  async processOpayTransaction(payload: OpayPayload) {
    const accountNumber = payload.accountNumber || payload.virtualAccountNumber;
    const amount = payload.amount;
    const reference = payload.reference || payload.trxRef;
    const status = payload.status || 'SUCCESS';

    if (!accountNumber) {
      throw new Error('Missing accountNumber in OPay webhook payload');
    }

    if (!amount || isNaN(amount)) {
      throw new Error('Missing or invalid amount');
    }

    if (status.toUpperCase() !== 'SUCCESS') {
      this.logger.warn(`Ignoring non-success OPay webhook: ${status}`);
      return;
    }

    const business = await this.prisma.business.findFirst({
      where: { virtualAccountNumber: accountNumber },
    });

    if (!business) {
      if (payload.mock) {
        const b = await this.prisma.business.findFirst();
        if (b) {
          await this.fundWallet(b.id, amount, reference || '');
          return;
        }
      }
      throw new Error(
        `Business with virtual account ${accountNumber} not found`,
      );
    }

    await this.fundWallet(business.id, amount, reference || '');
  }

  private async fundWallet(
    businessId: string,
    amount: number,
    reference: string,
  ) {
    const [updatedBusiness] = await this.prisma.$transaction([
      this.prisma.business.update({
        where: { id: businessId },
        data: {
          walletBalance: { increment: amount },
        },
      }),
      this.prisma.transaction.create({
        data: {
          type: TransactionType.CREDIT,
          amount,
          description: 'Wallet Funding via Virtual Account',
          channel: 'Virtual Account',
          status: TransactionStatus.COMPLETED,
          reference: reference || `FUND-${Date.now()}`,
          businessId,
        },
      }),
    ]);
    this.logger.log(
      `Funded Business ${businessId} wallet with ${amount}. New balance: ${updatedBusiness.walletBalance}`,
    );
  }

  async processMonnifyTransaction(payload: MonnifyPayload) {
    const eventType = payload.eventType;
    if (eventType !== 'SUCCESSFUL_TRANSACTION') {
      this.logger.warn(`Ignoring Monnify webhook event: ${eventType}`);
      return;
    }

    const data = payload.eventData;
    if (!data) throw new Error('No eventData found in Monnify payload');

    const amount = data.amountPaid;
    const reference = data.transactionReference;
    const accountNumber = data.destinationAccountInformation?.accountNumber;

    if (!accountNumber) {
      throw new Error('Missing destination accountNumber in Monnify payload');
    }

    const businesses: { id: string }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM "Business" WHERE "virtualAccountNumber" = $1 LIMIT 1`,
      accountNumber,
    );

    if (!businesses || businesses.length === 0) {
      throw new Error(
        `Business with virtual account ${accountNumber} not found for Monnify webhook`,
      );
    }

    await this.fundWallet(businesses[0].id, amount, reference);
  }

  async processSmsAlert(payload: SmsWebhookDto) {
    const { message, businessId } = payload;

    if (!message) throw new Error('No SMS message body found in payload');
    if (!businessId) {
      // Usually, webhook URL maps back to a business via ID or secret.
      throw new Error('Business mapping for SMS Webhook not found');
    }

    // Basic Bank Alert Parser for Nigerian SMS Strings
    const isCredit = /(credit|cr:|deposit|\+)/i.test(message);

    // Extract amount searching for currency codes followed by numbers
    const amountMatch = message.match(
      /(?:NGN|N|₦|Amt:|Amount:|Sum of)\s*([\d,]+\.?\d*)/i,
    );

    if (!isCredit || !amountMatch) {
      this.logger.warn(
        `SMS Webhook received but not identified as a Credit Alert: ${message}`,
      );
      return null;
    }

    const amountStr = amountMatch[1].replace(/,/g, '');
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      this.logger.warn(`Could not parse valid amount from SMS: ${message}`);
      return null;
    }

    let description = 'Bank Transfer via SMS Sync';
    const descMatch = message.match(
      /(?:Desc|Narration|Remarks|Details)\s*[:|-]\s*(.*?)(?=\s*(?:\n|Bal|Time|Date|$))/i,
    );
    if (descMatch && descMatch[1]) {
      description = descMatch[1].trim();
    }

    const hashStr = Buffer.from(message.substring(0, 50))
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '');
    const reference = `SMS-${Date.now()}-${hashStr}`;

    const newTxn = await this.prisma.transaction.create({
      data: {
        type: TransactionType.CREDIT,
        amount,
        description,
        channel: 'Bank Transfer',
        status: TransactionStatus.COMPLETED,
        reference,
        businessId,
      },
    });

    // Also increment the Business Wallet Balance to reflect real sync
    await this.prisma.business.update({
      where: { id: businessId },
      data: { walletBalance: { increment: amount } },
    });

    this.logger.log(
      `Parsed SMS & synced ₦${amount} for Business ${businessId}`,
    );
    return newTxn;
  }
}
