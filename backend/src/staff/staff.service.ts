import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, UpdateStaffDto, BulkPayDto } from './dto/staff.dto';
import { StaffStatus, TransactionType, TransactionStatus, PayrollStatus } from '@prisma/client';

@Injectable()
export class StaffService {
    constructor(private prisma: PrismaService) { }

    async findAll(businessId: string) {
        return this.prisma.staff.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, businessId: string) {
        const staff = await this.prisma.staff.findFirst({
            where: { id, businessId },
        });
        if (!staff) throw new NotFoundException('Staff member not found');
        return staff;
    }

    async create(businessId: string, dto: CreateStaffDto) {
        // Generate initials from name
        const initials = dto.avatarInitials ||
            dto.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

        // Random color
        const colors = ['#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#06B6D4', '#EC4899', '#10B981'];
        const avatarColor = dto.avatarColor || colors[Math.floor(Math.random() * colors.length)];

        return this.prisma.staff.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                role: dto.role,
                department: dto.department,
                bankName: dto.bankName,
                accountNumber: dto.accountNumber,
                monthlySalary: dto.monthlySalary || 0,
                avatarInitials: initials,
                avatarColor,
                businessId,
            },
        });
    }

    async update(id: string, businessId: string, dto: UpdateStaffDto) {
        await this.findOne(id, businessId);

        return this.prisma.staff.update({
            where: { id },
            data: {
                ...dto,
                status: dto.status as StaffStatus || undefined,
            },
        });
    }

    async remove(id: string, businessId: string) {
        await this.findOne(id, businessId);
        return this.prisma.staff.delete({ where: { id } });
    }

    // ─── PAY INDIVIDUAL ──────────────────────────────────

    async payStaff(businessId: string, staffId: string, amount: number, reason?: string) {
        const staff = await this.findOne(staffId, businessId);

        // Create transaction record
        const txn = await this.prisma.transaction.create({
            data: {
                type: TransactionType.PAYROLL,
                description: reason || `Salary payment to ${staff.name}`,
                amount,
                channel: 'Bank Transfer',
                status: TransactionStatus.COMPLETED,
                reference: `PAY-${Date.now()}-${staffId.slice(0, 8)}`,
                businessId,
            },
        });

        return { transaction: txn, staff };
    }

    // ─── BULK PAY ALL ────────────────────────────────────

    async bulkPay(businessId: string, dto: BulkPayDto) {
        // Get all active staff (or filtered by IDs)
        const where: any = { businessId, status: StaffStatus.ACTIVE };
        if (dto.staffIds && dto.staffIds.length > 0) {
            where.id = { in: dto.staffIds };
        }

        const staffList = await this.prisma.staff.findMany({ where });

        if (staffList.length === 0) {
            throw new BadRequestException('No active staff to pay');
        }

        const totalAmount = staffList.reduce((sum, s) => sum + s.monthlySalary, 0);

        // Create payroll run
        const payrollRun = await this.prisma.payrollRun.create({
            data: {
                totalAmount,
                staffCount: staffList.length,
                status: PayrollStatus.COMPLETED,
                businessId,
                items: {
                    create: staffList.map((s) => ({
                        amount: s.monthlySalary,
                        reason: dto.reason || 'Monthly salary',
                        staffId: s.id,
                    })),
                },
            },
            include: { items: true },
        });

        // Create individual transaction for each staff
        await this.prisma.transaction.createMany({
            data: staffList.map((s) => ({
                type: TransactionType.PAYROLL,
                description: `Bulk payroll: ${s.name} — ${dto.reason || 'Monthly salary'}`,
                amount: s.monthlySalary,
                channel: 'Bank Transfer',
                status: TransactionStatus.COMPLETED,
                reference: `BULK-${payrollRun.id.slice(0, 8)}-${s.id.slice(0, 8)}`,
                businessId,
            })),
        });

        return payrollRun;
    }

    async getPayrollHistory(businessId: string) {
        return this.prisma.payrollRun.findMany({
            where: { businessId },
            include: { items: { include: { staff: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
}
