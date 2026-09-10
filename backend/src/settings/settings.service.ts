import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import {
  TransactionType,
  TransactionStatus,
  BusinessPlan,
  UserRole,
} from '@prisma/client';
import {
  UpdateProfileDto,
  UpdateBusinessDto,
  ConnectPaymentDto,
} from './dto/settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private supabaseService: SupabaseService,
  ) {}

  // ─── PROFILE ─────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      emailNotifications: user.emailNotifications,
      business: user.business
        ? {
            id: user.business.id,
            name: user.business.name,
            type: user.business.type,
            address: user.business.address,
            city: user.business.city,
            state: user.business.state,
            phone: user.business.phone,
            email: user.business.email,
            logoUrl: user.business.logoUrl,
            plan: user.business.plan,
            storeMode: (user.business as any).storeMode ?? 'WORKSPACE',
            trialActivated: (user.business as any).trialActivated ?? false,
            walletBalance: (user.business as any).walletBalance || 0,
            virtualAccountNumber: (user.business as any).virtualAccountNumber,
            virtualAccountBank: (user.business as any).virtualAccountBank,
            departments: (user.business as any).departments,
            morningShift: (user.business as any).morningShift,
            nightShift: (user.business as any).nightShift,
            planExpiryDate: (user.business as any).planExpiryDate,
          }
        : null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.fullName && user.fullName && dto.fullName !== user.fullName) {
      throw new BadRequestException(
        'Name cannot be changed once set for security reasons.',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: dto.phone,
        avatarUrl: dto.avatarUrl,
        emailNotifications: dto.emailNotifications,
      },
    });
  }

  // ─── BUSINESS ────────────────────────────────────────

  async updateBusiness(userId: string, dto: UpdateBusinessDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });
    if (!user?.business) throw new NotFoundException('No business found');

    const business: any = user.business;
    const dataToUpdate: any = {};

    // Enforce immutability for core business identity fields
    const coreFields = ['name', 'type'];

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && value !== null) {
        // If it's a core field already filled and we're trying to change it, throw error
        if (
          coreFields.includes(key) &&
          business[key] &&
          business[key] !== '' &&
          business[key] !== null
        ) {
          if (business[key] !== value) {
            throw new BadRequestException(
              `${key} cannot be changed once filled.`,
            );
          }
        } else {
          // For departments (arrays), we compare contents if needed, but here we just allow the update
          dataToUpdate[key] = value;
        }
      }
    }

    // Only update if there are empty fields being filled
    if (Object.keys(dataToUpdate).length === 0) {
      return business;
    }

    try {
      return await this.prisma.business.update({
        where: { id: user.businessId as string },
        data: dataToUpdate,
      });
    } catch (e: any) {
      console.error('updateBusiness error:', e);
      throw new BadRequestException(e.message || 'Unknown error');
    }
  }

  // ─── PAYMENT INTEGRATIONS ─────────────────────────────

  async getPaymentIntegrations(businessId: string, role?: string) {
    const integrations = await this.prisma.paymentIntegration.findMany({
      where: { businessId },
    });

    // Return all providers with their status
    const providers = ['paystack', 'flutterwave', 'moniepoint', 'opay'];
    const result = providers.map((provider) => {
      const existing = integrations.find((i) => i.provider === provider);
      return {
        provider,
        connected: existing?.connected || false,
        hasKeys: !!(existing?.publicKey || existing?.secretKey),
      };
    });

    // Restrict to only correctly set up integrations for non-owners/admins
    if (role && role !== 'OWNER' && role !== 'ADMIN') {
      return result.filter((r) => r.connected);
    }

    return result;
  }

  async connectPayment(businessId: string, dto: ConnectPaymentDto) {
    return this.prisma.paymentIntegration.upsert({
      where: {
        businessId_provider: {
          businessId,
          provider: dto.provider,
        },
      },
      update: {
        publicKey: dto.publicKey,
        secretKey: dto.secretKey,
        connected: dto.connected,
      },
      create: {
        provider: dto.provider,
        publicKey: dto.publicKey,
        secretKey: dto.secretKey,
        connected: dto.connected,
        businessId,
      },
    });
  }

  // ─── WALLET & SUBSCRIPTION ────────────────────────────

  async generateVirtualAccount(businessId: string) {
    const business: any = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    if (business.virtualAccountNumber) {
      throw new BadRequestException('Virtual account already generated');
    }

    const apiKey = this.config.get('MONNIFY_API_KEY') || 'MK_TEST_KTGK14MMM5';
    const secretKey = this.config.get('MONNIFY_SECRET_KEY') || 'U9S1FSSXNXL4GF4CNAYZKSNG2T5FTFLD';
    const contractCode = this.config.get('MONNIFY_CONTRACT_CODE') || '9684136982';
    const baseUrl = this.config.get('MONNIFY_BASE_URL') || 'https://sandbox.monnify.com';

    try {
      // 1. Authenticate with Monnify
      const authResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`,
        },
      });

      if (!authResponse.ok) {
        const err = await authResponse.json();
        this.logger.error('Monnify Auth Error', err);
        throw new Error('Failed to authenticate with Monnify');
      }

      const authData = await authResponse.json();
      const accessToken = authData.responseBody.accessToken;

      // 2. Create Reserved Virtual Account
      const createResponse = await fetch(
        `${baseUrl}/api/v2/bank-transfer/reserved-accounts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountReference: `BIZHUB_${businessId.substring(0, 8)}_${Date.now()}`,
            accountName: business.name || 'BizHub Customer',
            currencyCode: 'NGN',
            contractCode: contractCode,
            customerEmail: business.email || 'customer@bizhub.com',
            customerName: business.name || 'BizHub Customer',
            getAllAvailableBanks: true,
          }),
        },
      );

      if (!createResponse.ok) {
        const err = await createResponse.json();
        this.logger.error('Monnify Account Creation Error', err);
        throw new Error(
          err.responseMessage || 'Failed to create virtual account',
        );
      }

      const createData = await createResponse.json();
      const accounts = createData.responseBody.accounts;

      if (!accounts || accounts.length === 0) {
        throw new Error('Monnify returned no bank accounts');
      }

      // We'll just grab the first bank account provided by Monnify (usually Wema or Moniepoint)
      const virtualAccountNumber = accounts[0].accountNumber;
      const virtualAccountBank = accounts[0].bankName;

      const updated: any = await this.prisma.business.update({
        where: { id: businessId },
        data: { virtualAccountNumber, virtualAccountBank } as any,
      });

      return {
        virtualAccountNumber: updated.virtualAccountNumber,
        virtualAccountBank: updated.virtualAccountBank,
        walletBalance: updated.walletBalance,
      };
    } catch (error) {
      this.logger.error('Virtual Account Generation failed', error);
      throw new BadRequestException(
        `Failed to generate live account: ${error.message}`,
      );
    }
  }

  async upgradePlan(businessId: string, plan: BusinessPlan) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    // ── STARTER PLAN SECURITY: one-time trial only ───────────────────
    if (plan === BusinessPlan.STARTER) {
      if ((business as any).trialActivated) {
        throw new BadRequestException(
          'Free trial has already been used for this business. Please select a paid plan.',
        );
      }
    }

    const costs: Record<string, number> = {
      STARTER: 0,
      GROWTH: 15000,
      SCALE: 50000,
      BASIC: 0,
      PREMIUM: 0,
    };

    const cost = costs[plan];

    if (cost === undefined) {
      throw new BadRequestException('Invalid plan parameter');
    }

    if ((business as any).walletBalance < cost) {
      throw new BadRequestException(
        `Insufficient wallet balance to upgrade to ${plan} plan. Need ₦${cost}.`,
      );
    }

    // Calculate expiry date (14 days for STARTER trial, 30 days for paid)
    const expiryDate = new Date();
    if (plan === BusinessPlan.STARTER) {
      expiryDate.setDate(expiryDate.getDate() + 14);
    } else {
      expiryDate.setDate(expiryDate.getDate() + 30);
    }

    // Atomic update: mark trial as used if STARTER
    const businessUpdate: any = {
      plan,
      planExpiryDate: expiryDate,
      walletBalance: { decrement: cost },
      ...(plan === BusinessPlan.STARTER && { trialActivated: true }),
    };

    // Perform atomic update and transaction log
    const [updatedBusiness, txn]: [any, any] = await this.prisma.$transaction([
      this.prisma.business.update({
        where: { id: businessId },
        data: businessUpdate,
      }),
      this.prisma.transaction.create({
        data: {
          type: TransactionType.DEBIT,
          description:
            plan === BusinessPlan.STARTER
              ? 'Starter plan free trial activated (3 days)'
              : `Subscription upgrade to ${plan} Plan`,
          amount: cost,
          channel: 'Bizhub Wallet',
          status: TransactionStatus.COMPLETED,
          reference: `SUB-${Date.now()}`,
          businessId,
        },
      }),
    ]);

    return {
      plan: updatedBusiness.plan,
      planExpiryDate: updatedBusiness.planExpiryDate,
      walletBalance: updatedBusiness.walletBalance,
      transaction: txn,
    };
  }

  async upgradePlanPaystack(
    businessId: string,
    plan: BusinessPlan,
    email: string,
    isYearly?: boolean,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const costs: Record<string, number> = {
      STARTER: 5000,
      GROWTH: 15000,
      SCALE: 50000,
    };

    let cost = costs[plan];
    if (cost === undefined)
      throw new BadRequestException('Invalid plan parameter');

    if (isYearly) {
      cost = cost * 10; // 10 months instead of 12
    }

    const secretKey = this.config.get('PAYSTACK_SECRET_KEY');
    if (!secretKey)
      throw new HttpException(
        'Paystack not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );

    const reference = `SUB_${plan}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: cost * 100, // kobo
        email,
        reference,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=success&ref=${reference}`,
        metadata: { action: 'upgrade_plan', plan, isYearly, businessId },
      }),
    });
    const data = await res.json();
    if (!data.status)
      throw new HttpException(
        data.message || 'Paystack error',
        HttpStatus.BAD_REQUEST,
      );

    // Create pending transaction
    await this.prisma.transaction.create({
      data: {
        businessId,
        type: TransactionType.DEBIT,
        amount: cost,
        description: `Paystack upgrade to ${plan} Plan`,
        channel: 'Paystack',
        status: TransactionStatus.PENDING,
        reference,
      },
    });

    return { reference, authorization_url: data.data.authorization_url };
  }

  async verifyPlanUpgrade(reference: string, businessId: string) {
    const secretKey = this.config.get('PAYSTACK_SECRET_KEY');
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );
    const data = await res.json();

    if (data.data?.status !== 'success') {
      throw new HttpException('Payment not successful', HttpStatus.BAD_REQUEST);
    }

    const plan = data.data?.metadata?.plan;

    await this.prisma.$transaction(async (tx) => {
      const existingTxn = await tx.transaction.findFirst({
        where: { reference },
      });
      if (existingTxn) {
        if (existingTxn.status !== 'COMPLETED') {
          await tx.transaction.update({
            where: { id: existingTxn.id },
            data: { status: 'COMPLETED' },
          });

          if (plan) {
            const expiryDate = new Date();
            const isYearly = data.data?.metadata?.isYearly;
            if (isYearly) {
              expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            } else {
              expiryDate.setDate(expiryDate.getDate() + 30);
            }
            await tx.business.update({
              where: { id: businessId },
              data: { plan, planExpiryDate: expiryDate } as any,
            });
          }
        }
      }
    });

    return { status: 'COMPLETED', plan, reference };
  }

  // ─── DELETE ACCOUNT ───────────────────────────────────

  async deleteAccount(userId: string, password?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password if user has a passwordHash
    if (user.passwordHash) {
      if (!password) {
        throw new BadRequestException(
          'Password confirmation is required to delete your account.',
        );
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Incorrect password.');
      }
    }

    const businessId = user.businessId;
    const isOwner = user.role === UserRole.OWNER;
    const emailToDelete = user.email.toLowerCase().trim();
    const supabaseUserId = user.supabaseUserId;

    // Collect all user IDs and Supabase IDs to delete from Supabase Auth
    const usersToDeleteFromSupabase: {
      id: string;
      supabaseUserId: string | null;
      email: string;
    }[] = [{ id: user.id, supabaseUserId, email: emailToDelete }];

    if (isOwner && businessId) {
      // Find all other users in this business so we clean their Supabase accounts too
      const teamUsers = await this.prisma.user.findMany({
        where: { businessId, id: { not: user.id } },
        select: { id: true, supabaseUserId: true, email: true },
      });
      usersToDeleteFromSupabase.push(...teamUsers);

      // Execute safe cascaded database deletion in transaction
      await this.prisma.$transaction(async (tx) => {
        // 1. Delete SaleItems (which restrict product deletion)
        await tx.saleItem.deleteMany({
          where: { sale: { businessId } },
        });

        // 2. Delete StockMovements
        await tx.stockMovement.deleteMany({
          where: { businessId },
        });

        // 3. Delete Sales
        await tx.sale.deleteMany({
          where: { businessId },
        });

        // 4. Delete Products
        await tx.product.deleteMany({
          where: { businessId },
        });

        // 5. Delete PayrollItems
        await tx.payrollItem.deleteMany({
          where: { payrollRun: { businessId } },
        });

        // 6. Delete PayrollRuns
        await tx.payrollRun.deleteMany({
          where: { businessId },
        });

        // 7. Delete ChatMessages & Members
        await tx.chatMessage.deleteMany({
          where: { room: { businessId } },
        });
        await tx.chatMember.deleteMany({
          where: { room: { businessId } },
        });
        await tx.chatRoom.deleteMany({
          where: { businessId },
        });

        // 8. Delete Transactions
        await tx.transaction.deleteMany({
          where: { businessId },
        });

        // 9. Delete InventoryItems
        await tx.inventoryItem.deleteMany({
          where: { businessId },
        });

        // 10. Delete Cameras
        await tx.camera.deleteMany({
          where: { businessId },
        });

        // 11. Delete SmsLogs
        await tx.smsLog.deleteMany({
          where: { businessId },
        });

        // 12. Delete PaymentIntegrations
        await tx.paymentIntegration.deleteMany({
          where: { businessId },
        });

        // 13. Delete Staff
        await tx.staff.deleteMany({
          where: { businessId },
        });

        // 14. Delete all Users in business
        await tx.user.deleteMany({
          where: { businessId },
        });

        // 15. Delete Business
        await tx.business.delete({
          where: { id: businessId },
        });

        // 16. Clean up support tickets for this owner email
        await tx.supportTicket.deleteMany({
          where: { userEmail: emailToDelete },
        });
      });
    } else {
      // Non-owner (Worker / Viewer / Admin) deleting their own account
      await this.prisma.$transaction(async (tx) => {
        // Disconnect staff record
        await tx.staff.updateMany({
          where: { userId: user.id },
          data: { userId: null },
        });

        // Remove chat messages & memberships
        await tx.chatMessage.deleteMany({
          where: { senderId: user.id },
        });
        await tx.chatMember.deleteMany({
          where: { userId: user.id },
        });

        // Delete user
        await tx.user.delete({
          where: { id: user.id },
        });
      });
    }

    // Clean up Supabase Auth records for all deleted users
    try {
      const supabase = this.supabaseService.getClient();
      for (const u of usersToDeleteFromSupabase) {
        if (u.supabaseUserId) {
          await supabase.auth.admin
            .deleteUser(u.supabaseUserId)
            .catch((err) => {
              this.logger.warn(
                `Supabase delete by ID error for ${u.email}: ${err.message}`,
              );
            });
        }
        // Also look up by email in Supabase in case ID differed or wasn't linked
        try {
          const { data: listData } = await supabase.auth.admin.listUsers();
          const target = listData?.users?.find(
            (su) => su.email?.toLowerCase() === u.email.toLowerCase(),
          );
          if (target) {
            await supabase.auth.admin.deleteUser(target.id);
            this.logger.log(`Deleted Supabase user ${target.id} (${u.email})`);
          }
        } catch (listErr: any) {
          this.logger.warn(
            `Supabase listUsers cleanup check failed: ${listErr.message}`,
          );
        }
      }
    } catch (sbErr: any) {
      this.logger.warn(`Supabase cleanup overall error: ${sbErr.message}`);
    }

    this.logger.log(
      `Successfully deleted account for ${emailToDelete} (role: ${user.role})`,
    );
    return {
      success: true,
      message: 'Account and associated data deleted successfully.',
    };
  }
}

