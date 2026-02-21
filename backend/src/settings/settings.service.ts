import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, UpdateBusinessDto, ConnectPaymentDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

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
                    departments: (user.business as any).departments,
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
}
