import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TransactionType,
  TransactionSource,
  TransactionStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import { TransactionsGateway } from './transactions.gateway';

export interface SyncPayload {
  amount: number;
  type: TransactionType;
  description: string;
  channel: string;
  occurredAt?: Date;
  source: TransactionSource;
  externalId?: string; // e.g. for Mono/Paystack ref
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TransactionsGateway,
  ) {}

  async processTransaction(businessId: string, payload: SyncPayload) {
    const occurredAt = payload.occurredAt || new Date();

    // Generate fingerprint for deduplication
    // amount + rounded minute + channel/last4
    const roundedTime = new Date(occurredAt);
    roundedTime.setSeconds(0, 0);

    const fingerprintRaw = `${businessId}-${payload.amount}-${payload.type}-${roundedTime.toISOString()}-${payload.channel}`;
    const fingerprint = crypto
      .createHash('md5')
      .update(fingerprintRaw)
      .digest('hex');

    this.logger.log(
      `Processing ${payload.source} txn for biz ${businessId}. Fingerprint: ${fingerprint}`,
    );

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.upsert({
          where: { fingerprint },
          update: {}, // Do nothing if it already exists (deduplication)
          create: {
            type: payload.type,
            source: payload.source,
            description: payload.description,
            amount: payload.amount,
            channel: payload.channel,
            fingerprint: fingerprint,
            status: TransactionStatus.COMPLETED,
            occurredAt: occurredAt,
            businessId,
            reference:
              payload.externalId || `SYNC-${fingerprint.substring(0, 8)}`,
          },
        });

        // If it was newly created (not just upserted), update the business balance
        // Note: Prisma upsert returns the record even if it was just found.
        // To be safe with idempotency, we check if we should update.
        // However, a better way is to use a unique constraint on fingerprint.
        // If the upsert's "create" part ran, we want to update the balance.

        // Since Prisma doesn't tell us if it created or updated easily in a single call,
        // we'll check if the transaction's createdAt is very recent.
        const isNew =
          new Date().getTime() - transaction.createdAt.getTime() < 1000;

        if (isNew) {
          const balanceChange =
            payload.type === TransactionType.CREDIT
              ? payload.amount
              : -payload.amount;
          await tx.business.update({
            where: { id: businessId },
            data: {
              walletBalance: { increment: balanceChange },
            },
          });
        }

        return transaction;
      });

      // Emit socket event for real-time updates
      this.gateway.emitTransaction(businessId, result);

      return result;
    } catch (error) {
      this.logger.error(`Failed to sync transaction: ${error.message}`);
      throw error;
    }
  }
}
