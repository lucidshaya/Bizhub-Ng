import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, StaffStatus, CameraStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    async getSummary(businessId: string) {
        const cacheKey = `dashboard_summary_${businessId}`;
        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData) return cachedData;

        const [
            staffCount,
            activeStaff,
            camerasOnline,
            totalCameras,
            businessProfile,
            recentTransactions,
            allTransactions,
            unreadMessages,
            staffList,
            recentMessages
        ] = await Promise.all([
            this.prisma.staff.count({ where: { businessId } }),
            this.prisma.staff.count({ where: { businessId, status: StaffStatus.ACTIVE } }),
            this.prisma.camera.count({ where: { businessId, status: CameraStatus.LIVE } }),
            this.prisma.camera.count({ where: { businessId } }),
            this.prisma.business.findUnique({
                where: { id: businessId },
                select: { walletBalance: true, virtualAccountNumber: true, virtualAccountBank: true } as any
            }),
            this.prisma.transaction.findMany({
                where: { businessId },
                orderBy: { date: 'desc' },
                take: 5,
            }),
            this.prisma.transaction.findMany({ where: { businessId } }),
            this.prisma.chatMessage.count({
                where: {
                    room: { businessId },
                    read: false,
                },
            }),
            this.prisma.user.findMany({
                where: { businessId, role: { not: 'OWNER' } },
                take: 5,
                select: { id: true, fullName: true, avatarUrl: true, role: true }
            }),
            this.prisma.chatMessage.findMany({
                where: { room: { businessId } },
                orderBy: { sentAt: 'desc' },
                take: 3,
                include: { sender: { select: { fullName: true, avatarUrl: true } } }
            })
        ]);

        const totalRevenue = allTransactions
            .filter((t) => t.type === TransactionType.CREDIT)
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = allTransactions
            .filter(
                (t) =>
                    t.type === TransactionType.DEBIT ||
                    t.type === TransactionType.PAYROLL ||
                    t.type === TransactionType.WITHDRAWAL,
            )
            .reduce((sum, t) => sum + t.amount, 0);

        const result = {
            balance: totalRevenue - totalExpenses, // historical net
            walletBalance: businessProfile?.walletBalance || 0,
            virtualAccountNumber: businessProfile?.virtualAccountNumber,
            virtualAccountBank: businessProfile?.virtualAccountBank,
            totalRevenue,
            totalExpenses,
            staffCount,
            activeStaff,
            camerasOnline,
            totalCameras,
            unreadMessages,
            recentTransactions,
            staffList,
            recentMessages: recentMessages.map(m => ({
                id: m.id,
                text: m.text,
                sender: m.sender.fullName,
                avatar: m.sender.avatarUrl,
                time: m.sentAt
            }))
        };

        await this.cacheManager.set(cacheKey, result, 60000); // Cache for 1 minute
        return result;
    }

    async getActivityFeed(businessId: string) {
        const cacheKey = `dashboard_activity_${businessId}`;
        const cachedData = await this.cacheManager.get<any[]>(cacheKey);
        if (cachedData) return cachedData;

        const transactions = await this.prisma.transaction.findMany({
            where: { businessId },
            orderBy: { date: 'desc' },
            take: 10,
        });

        const result = transactions.map((t) => ({
            id: t.id,
            text: t.description,
            type: t.type,
            amount: t.amount,
            time: t.date,
        }));

        await this.cacheManager.set(cacheKey, result, 60000); // Cache for 1 minute
        return result;
    }
}
