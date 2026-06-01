import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../transactions/sync.service';
import axios from 'axios';

@Injectable()
export class MonoService {
  private readonly logger = new Logger(MonoService.name);
  private readonly secretKey = 'test_sk_jv6bfdkdoy1ugecwmknd';

  constructor(
    private prisma: PrismaService,
    private syncService: SyncService,
  ) {}

  async fetchAndProcessTransactions(monoAccountId: string) {
    // Find the business associated with this account_id
    const business = await this.prisma.business.findUnique({
      where: { monoAccountId },
    });

    if (!business) {
      this.logger.error(
        `No business found for Mono accountId: ${monoAccountId}`,
      );
      return;
    }

    this.logger.log(`Fetching Mono transactions for business: ${business.id}`);

    try {
      const response = await axios.get(
        `https://api.withmono.com/v2/accounts/${monoAccountId}/transactions`,
        {
          headers: {
            'mono-sec-key': this.secretKey,
          },
          params: {
            'x-realtime': 'true',
          },
        },
      );

      const transactions = response.data?.data || [];
      this.logger.log(`Fetched ${transactions.length} transactions from Mono.`);

      for (const tx of transactions) {
        await this.syncService.processTransaction(business.id, {
          amount: tx.amount / 100, // Mono returns in kobo
          type: tx.type === 'credit' ? 'CREDIT' : 'DEBIT',
          description: tx.narration || tx.description || 'Mono Bank Transfer',
          channel: tx.bank || 'Mono',
          occurredAt: new Date(tx.date),
          source: 'MONO',
          externalId: tx._id || tx.id,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch transactions from Mono: ${error.message}`,
      );
    }
  }
}
