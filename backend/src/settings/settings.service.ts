import { Injectable, NotFoundException, BadRequestException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TransactionType, TransactionStatus, BusinessPlan } from '@prisma/client';
import { UpdateProfileDto, UpdateBusinessDto, ConnectPaymentDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
    private readonly logger = new Logger(SettingsService.name);

    constructor(private prisma: PrismaService, private config: ConfigService) { }

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
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                fullName: dto.fullName,
                phone: dto.phone,
                avatarUrl: dto.avatarUrl,
            },
        });
    }

    // ─── BUSINESS ────────────────────────────────────────

    async updateBusiness(userId: string, dto: UpdateBusinessDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.businessId) throw new NotFoundException('No business found');

        try {
            return await this.prisma.business.update({
                where: { id: user.businessId },
                data: dto,
            });
        } catch (e) {
            console.error("updateBusiness error:", e);
            throw new BadRequestException(e.message || "Unknown error");
        }
    }

    // ─── PAYMENT INTEGRATIONS ─────────────────────────────

    async getPaymentIntegrations(businessId: string) {
        const integrations = await this.prisma.paymentIntegration.findMany({
            where: { businessId },
        });

        // Return all providers with their status
        const providers = ['paystack', 'flutterwave', 'moniepoint', 'opay'];
        return providers.map((provider) => {
            const existing = integrations.find((i) => i.provider === provider);
            return {
                provider,
                connected: existing?.connected || false,
                hasKeys: !!(existing?.publicKey || existing?.secretKey),
            };
        });
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
        const business: any = await this.prisma.business.findUnique({ where: { id: businessId } });
        if (!business) throw new NotFoundException('Business not found');

        if (business.virtualAccountNumber) {
            throw new BadRequestException('Virtual account already generated');
        }

        const apiKey = 'MK_TEST_KTGK14MMM5';
        const secretKey = 'U9S1FSSXNXL4GF4CNAYZKSNG2T5FTFLD';
        const contractCode = '9684136982';
        const baseUrl = 'https://sandbox.monnify.com';

        try {
            // 1. Authenticate with Monnify
            const authResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`
                }
            });

            if (!authResponse.ok) {
                const err = await authResponse.json();
                this.logger.error('Monnify Auth Error', err);
                throw new Error('Failed to authenticate with Monnify');
            }

            const authData = await authResponse.json();
            const accessToken = authData.responseBody.accessToken;

            // 2. Create Reserved Virtual Account
            const createResponse = await fetch(`${baseUrl}/api/v2/bank-transfer/reserved-accounts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accountReference: `BIZHUB_${businessId.substring(0, 8)}_${Date.now()}`,
                    accountName: business.name || 'BizHub Customer',
                    currencyCode: 'NGN',
                    contractCode: contractCode,
                    customerEmail: business.email || 'customer@bizhub.com',
                    customerName: business.name || 'BizHub Customer',
                    getAllAvailableBanks: true
                })
            });

            if (!createResponse.ok) {
                const err = await createResponse.json();
                this.logger.error('Monnify Account Creation Error', err);
                throw new Error(err.responseMessage || 'Failed to create virtual account');
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
                data: { virtualAccountNumber, virtualAccountBank } as any
            });

            return {
                virtualAccountNumber: updated.virtualAccountNumber,
                virtualAccountBank: updated.virtualAccountBank,
                walletBalance: updated.walletBalance
            };
        } catch (error) {
            this.logger.error('Virtual Account Generation failed', error);
            throw new BadRequestException(`Failed to generate live account: ${error.message}`);
        }
    }

    async upgradePlan(businessId: string, plan: BusinessPlan) {
        const business = await this.prisma.business.findUnique({ where: { id: businessId } });
        if (!business) throw new NotFoundException('Business not found');

        const costs: Record<string, number> = {
            STARTER: 5000,
            GROWTH: 15000,
            SCALE: 50000,
            BASIC: 0,
            PREMIUM: 0
        };

        const cost = costs[plan];

        if (cost === undefined) {
            throw new BadRequestException('Invalid plan parameter');
        }

        if ((business as any).walletBalance < cost) {
            throw new BadRequestException(`Insufficient wallet balance to upgrade to ${plan} plan. Need ₦${cost}.`);
        }

        // Calculate expiry date (30 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        // Perform atomic update and transaction log
        const [updatedBusiness, txn]: [any, any] = await this.prisma.$transaction([
            this.prisma.business.update({
                where: { id: businessId },
                data: {
                    plan,
                    planExpiryDate: expiryDate,
                    walletBalance: { decrement: cost } as any
                } as any
            }),
            this.prisma.transaction.create({
                data: {
                    type: TransactionType.DEBIT,
                    description: `Subscription upgrade to ${plan} Plan`,
                    amount: cost,
                    channel: 'Bizhub Wallet',
                    status: TransactionStatus.COMPLETED,
                    reference: `SUB-${Date.now()}`,
                    businessId
                }
            })
        ]);

        return {
            plan: updatedBusiness.plan,
            planExpiryDate: updatedBusiness.planExpiryDate,
            walletBalance: updatedBusiness.walletBalance,
            transaction: txn
        };
    }

    async upgradePlanPaystack(businessId: string, plan: BusinessPlan, email: string) {
        const business = await this.prisma.business.findUnique({ where: { id: businessId } });
        if (!business) throw new NotFoundException('Business not found');

        const costs: Record<string, number> = {
            STARTER: 5000,
            GROWTH: 15000,
            SCALE: 50000,
        };

        const cost = costs[plan];
        if (cost === undefined) throw new BadRequestException('Invalid plan parameter');

        const secretKey = this.config.get('PAYSTACK_SECRET_KEY');
        if (!secretKey) throw new HttpException('Paystack not configured', HttpStatus.SERVICE_UNAVAILABLE);

        const reference = `SUB_${plan}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const res = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: cost * 100, // kobo
                email,
                reference,
                callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/settings?payment=success&ref=${reference}`,
                metadata: { action: 'upgrade_plan', plan, businessId }
            }),
        });
        const data = await res.json();
        if (!data.status) throw new HttpException(data.message || 'Paystack error', HttpStatus.BAD_REQUEST);

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
}
