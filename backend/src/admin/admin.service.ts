import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    // ─── PLATFORM STATS ───────────────────────────────────

    async getPlatformStats() {
        const [
            totalUsers,
            totalBusinesses,
            totalStaff,
            totalTransactions,
            totalCameras,
            totalChatMessages,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.business.count(),
            this.prisma.staff.count(),
            this.prisma.transaction.count(),
            this.prisma.camera.count(),
            this.prisma.chatMessage.count(),
        ]);

        // Revenue metrics
        const revenueAgg = await this.prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: 'CREDIT', status: 'COMPLETED' },
        });

        const expenseAgg = await this.prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: { in: ['DEBIT', 'PAYROLL', 'WITHDRAWAL'] } },
        });

        // Users who have at least one completed transaction (paid users)
        const paidBusinesses = await this.prisma.transaction.groupBy({
            by: ['businessId'],
            where: { status: 'COMPLETED', type: 'CREDIT' },
        });

        // Users by plan
        const planCounts = await this.prisma.business.groupBy({
            by: ['plan'],
            _count: true,
        });

        // Recent signups (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSignups = await this.prisma.user.count({
            where: { createdAt: { gte: thirtyDaysAgo } },
        });

        // Today's signups
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todaySignups = await this.prisma.user.count({
            where: { createdAt: { gte: todayStart } },
        });

        return {
            totalUsers,
            totalBusinesses,
            totalStaff,
            totalTransactions,
            totalCameras,
            totalChatMessages,
            totalRevenue: revenueAgg._sum.amount || 0,
            totalExpenses: expenseAgg._sum.amount || 0,
            paidUsers: paidBusinesses.length,
            unpaidUsers: totalBusinesses - paidBusinesses.length,
            planBreakdown: planCounts.reduce((acc, p) => {
                acc[p.plan || 'BASIC'] = p._count;
                return acc;
            }, {} as Record<string, number>),
            recentSignups,
            todaySignups,
        };
    }

    // ─── ALL USERS ────────────────────────────────────────

    async getAllUsers(page = 1, limit = 20, search?: string) {
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    business: {
                        select: { name: true, type: true, plan: true },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        // For each user, check if they have paid transactions
        const userIds = users.map((u) => u.id);
        const businessIds = users.map((u) => u.businessId).filter(Boolean);

        const paidBusinessIds = await this.prisma.transaction.groupBy({
            by: ['businessId'],
            where: {
                businessId: { in: businessIds as string[] },
                type: 'CREDIT',
                status: 'COMPLETED',
            },
        });

        const paidSet = new Set(paidBusinessIds.map((p) => p.businessId));

        return {
            data: users.map((u) => ({
                id: u.id,
                fullName: u.fullName,
                email: u.email,
                phone: u.phone,
                role: u.role,
                createdAt: u.createdAt,
                businessName: u.business?.name || null,
                businessType: u.business?.type || null,
                plan: u.business?.plan || 'BASIC',
                hasPaid: u.businessId ? paidSet.has(u.businessId) : false,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ─── RECENT ACTIVITY ──────────────────────────────────

    async getRecentActivity(limit = 20) {
        const [recentUsers, recentTransactions] = await Promise.all([
            this.prisma.user.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: { id: true, fullName: true, email: true, createdAt: true },
            }),
            this.prisma.transaction.findMany({
                take: limit,
                orderBy: { date: 'desc' },
                include: { business: { select: { name: true } } },
            }),
        ]);

        const activities = [
            ...recentUsers.map((u) => ({
                type: 'signup',
                description: `${u.fullName} signed up`,
                email: u.email,
                time: u.createdAt,
            })),
            ...recentTransactions.map((t) => ({
                type: 'transaction',
                description: `${t.business?.name || 'Unknown'}: ${t.description} (₦${t.amount.toLocaleString()})`,
                email: null,
                time: t.date,
            })),
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return activities.slice(0, limit);
    }

    // ─── SUPPORT TICKETS (simulated from chat messages) ───

    async getSupportMetrics() {
        const totalRooms = await this.prisma.chatRoom.count();
        const totalMessages = await this.prisma.chatMessage.count();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayMessages = await this.prisma.chatMessage.count({
            where: { sentAt: { gte: todayStart } },
        });

        return { totalRooms, totalMessages, todayMessages };
    }
}
