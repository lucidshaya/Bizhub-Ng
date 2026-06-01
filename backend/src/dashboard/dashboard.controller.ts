import {
  Controller,
  Get,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UserCacheInterceptor } from '../common/interceptors/user-cache.interceptor';

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@UseInterceptors(UserCacheInterceptor)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private prisma: PrismaService,
  ) {}

  private async getBusinessId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.businessId) throw new Error('No business found for user');
    return user.businessId;
  }

  @Get('summary')
  async getSummary(@Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.dashboardService.getSummary(businessId);
  }

  @Get('activity')
  async getActivity(@Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.dashboardService.getActivityFeed(businessId);
  }
}
