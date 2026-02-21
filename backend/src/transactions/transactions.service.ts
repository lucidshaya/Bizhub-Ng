import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, TransactionFilterDto } from './dto/transaction.dto';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class TransactionsService {
    constructor(private prisma: PrismaService) { }

    async findAll(businessId: string, filters?: TransactionFilterDto) {
        const where: any = { businessId };
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;

        if (filters?.type) {
            where.type = filters.type as TransactionType;
        }
        if (filters?.status) {
            where.status = filters.status as TransactionStatus;
        }
        if (filters?.channel) {
            where.channel = { contains: filters.channel, mode: 'insensitive' };
        }
        if (filters?.search) {
            where.description = { contains: filters.search, mode: 'insensitive' };
        }
        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters?.startDate) where.date.gte = new Date(filters.startDate);
            if (filters?.endDate) where.date.lte = new Date(filters.endDate);
        }

        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.transaction.count({ where }),
        ]);

        return {
            data: transactions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string, businessId: string) {
        const txn = await this.prisma.transaction.findFirst({
            where: { id, businessId },
        });
        if (!txn) throw new NotFoundException('Transaction not found');
        return txn;
    }

    async create(businessId: string, dto: CreateTransactionDto) {
        return this.prisma.transaction.create({
            data: {
                type: dto.type as TransactionType,
                description: dto.description,
                amount: dto.amount,
                channel: dto.channel || 'Bank Transfer',
                status: (dto.status as TransactionStatus) || TransactionStatus.COMPLETED,
                reference: dto.reference || `TXN-${Date.now()}`,
                businessId,
            },
        });
    }

    async delete(id: string, businessId: string) {
        await this.findOne(id, businessId);
        return this.prisma.transaction.delete({ where: { id } });
    }

    // ─── SUMMARY ─────────────────────────────────────────

    async getSummary(businessId: string) {
        const allTxns = await this.prisma.transaction.findMany({
            where: { businessId },
        });

        const totalCredits = allTxns
            .filter((t) => t.type === TransactionType.CREDIT)
            .reduce((sum, t) => sum + t.amount, 0);

        const totalDebits = allTxns
            .filter((t) => t.type === TransactionType.DEBIT || t.type === TransactionType.PAYROLL || t.type === TransactionType.WITHDRAWAL)
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalCredits,
            totalDebits,
            balance: totalCredits - totalDebits,
            totalTransactions: allTxns.length,
        };
    }

    // ─── EXPORT DATA ─────────────────────────────────────

    async getExportData(businessId: string, filters?: TransactionFilterDto) {
        const where: any = { businessId };
        if (filters?.type) where.type = filters.type;
        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters?.startDate) where.date.gte = new Date(filters.startDate);
            if (filters?.endDate) where.date.lte = new Date(filters.endDate);
        }

        return this.prisma.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
        });
    }
}
