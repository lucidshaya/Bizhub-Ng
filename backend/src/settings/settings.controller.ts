import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  UpdateProfileDto,
  UpdateBusinessDto,
  ConnectPaymentDto,
  UpgradePlanDto,
  UpgradePlanPaystackDto,
  DeleteAccountDto,
} from './dto/settings.dto';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { IsBilling } from '../auth/decorators/is-billing.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessPlan } from '@prisma/client';

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@IsBilling()
@Controller('settings')
export class SettingsController {
  constructor(
    private settingsService: SettingsService,
    private prisma: PrismaService,
  ) {}

  private async getBusinessId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.businessId) throw new Error('No business found for user');
    return user.businessId;
  }

  @Get('/profile')
  async getProfile(@Request() req: any) {
    return this.settingsService.getProfile(req.user.sub);
  }

  @Patch('/profile')
  async updateProfile(@Body() dto: UpdateProfileDto, @Request() req: any) {
    return this.settingsService.updateProfile(req.user.sub, dto);
  }

  @Patch('/business')
  async updateBusiness(@Body() dto: UpdateBusinessDto, @Request() req: any) {
    return this.settingsService.updateBusiness(req.user.sub, dto);
  }

  @Get('/payments')
  async getPaymentIntegrations(@Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.settingsService.getPaymentIntegrations(
      businessId,
      req.user.role,
    );
  }

  @Post('/payments/connect')
  async connectPayment(@Body() dto: ConnectPaymentDto, @Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.settingsService.connectPayment(businessId, dto);
  }

  @Post('/wallet/generate')
  async generateVirtualAccount(@Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.settingsService.generateVirtualAccount(businessId);
  }

  @Post('/wallet/upgrade-plan')
  async upgradePlanWallet(@Body() dto: UpgradePlanDto, @Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.settingsService.upgradePlan(businessId, dto.plan);
  }

  @Post('/paystack/upgrade-plan')
  async upgradePlanPaystack(
    @Body() dto: UpgradePlanPaystackDto,
    @Request() req: any,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    return this.settingsService.upgradePlanPaystack(
      businessId,
      dto.plan,
      user!.email,
      !!dto.isYearly,
    );
  }

  @Post('/paystack/verify-upgrade')
  async verifyPlanUpgrade(
    @Body('reference') reference: string,
    @Request() req: any,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.settingsService.verifyPlanUpgrade(reference, businessId);
  }

  @Post('/mono/link')
  async linkMono(@Body('code') code: string, @Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    await this.prisma.business.update({
      where: { id: businessId },
      data: { monoAccountId: code },
    });
    return { success: true, message: 'Bank account linked successfully' };
  }

  @Delete('/account')
  async deleteAccount(@Request() req: any, @Body() dto: DeleteAccountDto) {
    return this.settingsService.deleteAccount(req.user.sub, dto?.password);
  }

  @Post('/delete-account')
  async deleteAccountPost(@Request() req: any, @Body() dto: DeleteAccountDto) {
    return this.settingsService.deleteAccount(req.user.sub, dto?.password);
  }
}

