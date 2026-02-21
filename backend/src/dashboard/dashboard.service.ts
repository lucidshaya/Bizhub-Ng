import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, StaffStatus, CameraStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getSummary(businessId: string) {
        const [
            staffCount,
            activeStaff,
            camerasOnline,
            totalCameras,
            recentTransactions,
            allTransactions,
            unreadMessages,
            staffList,
            recentMessages,
        ] = await Promise.all([
            this.prisma.staff.count({ where: { businessId } }),
            this.prisma.staff.count({ where: { businessId, status: StaffStatus.ACTIVE } }),
            this.prisma.camera.count({ where: { businessId, status: CameraStatus.LIVE } }),
            this.prisma.camera.count({ where: { businessId } }),
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

        return {
            balance: totalRevenue - totalExpenses,
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
    }

    async getActivityFeed(businessId: string) {
        const transactions = await this.prisma.transaction.findMany({
            where: { businessId },
            orderBy: { date: 'desc' },
            take: 10,
        });

        return transactions.map((t) => ({
            id: t.id,
            text: t.description,
            type: t.type,
            amount: t.amount,
            time: t.date,
        }));
    }
}
