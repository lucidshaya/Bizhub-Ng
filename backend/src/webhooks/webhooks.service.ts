import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly transactionsService: TransactionsService
    ) { }

    async processPosTransaction(payload: any, headers: Record<string, string>) {
        // Here we define a generic payload mapping. 
        // A real-world scenario would use standard OPay or Moniepoint signature verification first.

        // Typical fields we expect from a POS webhook
        // posId / terminalId: to identify which business this belongs to
        // amount: transaction amount
        // type: "CREDIT" / "DEBIT"
        // reference: unique transaction ID from provider
        // status: "SUCCESS" / "FAILED"

        const terminalId = payload.terminalId || payload.posId;
        const amount = payload.amount;
        const reference = payload.reference || payload.trxRef;
        const status = payload.status || payload.transactionStatus; // e.g., 'SUCCESS', 'APPROVED'

        if (!terminalId) {
            throw new Error('Missing terminalId or posId in webhook payload');
        }

        if (!amount || isNaN(amount)) {
            throw new Error('Missing or invalid amount');
        }

        // Optional: Lookup business by terminalId.
        // For this demo, if the user provides businessId directly in the test payload, we use it.
        // Otherwise, in a real POS integration, you'd have a Terminal model mapping terminalId -> businessId.
        // We will assume the payload includes a businessId for direct mapping or we lookup via terminal. 

        let businessId = payload.businessId;

        if (!businessId) {
            // Find a payment integration or terminal that matches. Since we don't have a Terminal model,
            // we will search the PaymentIntegration for a matching provider (mock logic).
            // For now, if no businessId is provided, we fail gracefully.
            this.logger.warn(`Webhook received without businessId. Searching for terminalId ${terminalId} is not fully implemented.`);
            // Mock: Just grab the first business for testing purposes if payload has mock=true
            if (payload.mock) {
                const b = await this.prisma.business.findFirst();
                if (b) businessId = b.id;
            } else {
                throw new Error('Business mapping for terminal not found');
            }
        }

        // Map status
        let mappedStatus: TransactionStatus = TransactionStatus.PENDING;
        if (typeof status === 'string') {
            const s = status.toUpperCase();
            if (s === 'SUCCESS' || s === 'APPROVED' || s === '00') {
                mappedStatus = TransactionStatus.COMPLETED;
            } else if (s === 'FAILED' || s === 'DECLINED') {
                mappedStatus = TransactionStatus.FAILED;
            }
        }

        // Map type. Most POS receive payments (CREDIT to business).
        const mappedType = TransactionType.CREDIT;

        // Insert into transactions
        await this.transactionsService.create(businessId, {
            type: mappedType,
            amount: parseFloat(amount),
            description: `POS Payment via Terminal ${terminalId}`,
            channel: 'POS',
            reference: reference || `POS-${Date.now()}`,
            status: mappedStatus
        });

        this.logger.log(`Successfully processed POS transaction ${reference} for Business ${businessId}`);
    }
}
