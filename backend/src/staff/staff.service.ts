import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateStaffDto, UpdateStaffDto, BulkPayDto } from './dto/staff.dto';
import {
  StaffStatus,
  TransactionType,
  TransactionStatus,
  PayrollStatus,
} from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(businessId: string) {
    const cacheKey = `staff_list_${businessId}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const result = await this.prisma.staff.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    await this.cacheManager.set(cacheKey, result, 300000); // 5 minutes
    return result;
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
    const initials =
      dto.avatarInitials ||
      dto.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Random color
    const colors = [
      '#3B82F6',
      '#8B5CF6',
      '#EF4444',
      '#F59E0B',
      '#06B6D4',
      '#EC4899',
      '#10B981',
    ];
    const avatarColor =
      dto.avatarColor || colors[Math.floor(Math.random() * colors.length)];

    const staff = await this.prisma.staff.create({
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

    await this.cacheManager.del(`staff_list_${businessId}`);
    await this.cacheManager.del(`dashboard_summary_${businessId}`);
    return staff;
  }

  async update(id: string, businessId: string, dto: UpdateStaffDto) {
    await this.findOne(id, businessId);

    const updated = await this.prisma.staff.update({
      where: { id },
      data: {
        ...dto,
        status: (dto.status as StaffStatus) || undefined,
      },
    });

    await this.cacheManager.del(`staff_list_${businessId}`);
    await this.cacheManager.del(`dashboard_summary_${businessId}`);
    return updated;
  }

  async remove(id: string, businessId: string) {
    await this.findOne(id, businessId);
    const deleted = await this.prisma.staff.delete({ where: { id } });
    await this.cacheManager.del(`staff_list_${businessId}`);
    await this.cacheManager.del(`dashboard_summary_${businessId}`);
    return deleted;
  }

  async resendInvite(staffId: string, businessId: string) {
    const staff = await this.findOne(staffId, businessId);
    if (!staff.email) {
      throw new BadRequestException(
        'This staff member has no email address on file. Add one before sending an invite.',
      );
    }
    if (staff.inviteStatus === 'ACCEPTED') {
      throw new BadRequestException(
        'This staff member has already accepted their invitation.',
      );
    }
    return this.authService.inviteWorker(businessId, {
      name: staff.name,
      email: staff.email,
      role: staff.role,
      phone: staff.phone ?? undefined,
    });
  }

  // ─── PAY INDIVIDUAL ──────────────────────────────────

  async payStaff(
    businessId: string,
    staffId: string,
    amount: number,
    reason?: string,
  ) {
    const staff = await this.findOne(staffId, businessId);

    // 1. Check wallet balance
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    if (business.walletBalance < amount) {
      throw new BadRequestException('Insufficient wallet balance to pay staff');
    }

    // 2. Perform transaction: deduct wallet, create transaction record
    const [updatedBusiness, txn] = await this.prisma.$transaction([
      this.prisma.business.update({
        where: { id: businessId },
        data: { walletBalance: { decrement: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          type: TransactionType.PAYROLL_DISBURSEMENT,
          description: reason || `Salary payment to ${staff.name}`,
          amount,
          channel: 'Wallet Payout',
          status: TransactionStatus.COMPLETED,
          reference: `PAY-${Date.now()}-${staffId.slice(0, 8)}`,
          businessId,
        },
      }),
    ]);

    return {
      transaction: txn,
      staff,
      newWalletBalance: updatedBusiness.walletBalance,
    };
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

    // 1. Check wallet balance
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    if (business.walletBalance < totalAmount) {
      throw new BadRequestException(
        'Insufficient wallet balance for bulk payroll',
      );
    }

    // 2. Deduct wallet
    const updatedBusiness = await this.prisma.business.update({
      where: { id: businessId },
      data: { walletBalance: { decrement: totalAmount } },
    });

    // 3. Create payroll run
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

    // 4. Create individual transaction for each staff
    await this.prisma.transaction.createMany({
      data: staffList.map((s) => ({
        type: TransactionType.PAYROLL_DISBURSEMENT,
        description: `Bulk payroll: ${s.name} — ${dto.reason || 'Monthly salary'}`,
        amount: s.monthlySalary,
        channel: 'Wallet Payout',
        status: TransactionStatus.COMPLETED,
        reference: `BULK-${payrollRun.id.slice(0, 8)}-${s.id.slice(0, 8)}`,
        businessId,
      })),
    });

    return { payrollRun, newWalletBalance: updatedBusiness.walletBalance };
  }

  async getPayrollHistory(businessId: string) {
    return this.prisma.payrollRun.findMany({
      where: { businessId },
      include: { items: { include: { staff: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
