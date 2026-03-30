import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateProfileDto, UpdateBusinessDto, ConnectPaymentDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessPlan } from '@prisma/client';

export class UpgradePlanDto {
    plan: BusinessPlan;
}

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
    constructor(
        private settingsService: SettingsService,
        private prisma: PrismaService,
    ) { }

    private async getBusinessId(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.businessId) throw new Error('No business found for user');
        return user.businessId;
    }

    @Get('profile')
    async getProfile(@Request() req: any) {
        return this.settingsService.getProfile(req.user.sub);
    }

    @Patch('profile')
    async updateProfile(@Body() dto: UpdateProfileDto, @Request() req: any) {
        return this.settingsService.updateProfile(req.user.sub, dto);
    }

    @Patch('business')
    async updateBusiness(@Body() dto: UpdateBusinessDto, @Request() req: any) {
        return this.settingsService.updateBusiness(req.user.sub, dto);
    }

    @Get('payments')
    async getPaymentIntegrations(@Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.settingsService.getPaymentIntegrations(businessId);
    }

    @Post('payments/connect')
    async connectPayment(@Body() dto: ConnectPaymentDto, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.settingsService.connectPayment(businessId, dto);
    }

    @Post('wallet/generate')
    async generateVirtualAccount(@Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.settingsService.generateVirtualAccount(businessId);
    }

    @Post('wallet/upgrade-plan')
    async upgradePlan(@Body() dto: UpgradePlanDto, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.settingsService.upgradePlan(businessId, dto.plan);
    }

    @Post('paystack/upgrade-plan')
    async upgradePlanPaystack(@Body() dto: UpgradePlanDto, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
        return this.settingsService.upgradePlanPaystack(businessId, dto.plan, user!.email);
    }
}
