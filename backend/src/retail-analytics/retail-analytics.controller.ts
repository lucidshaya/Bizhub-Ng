import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { RetailAnalyticsService } from './retail-analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('retail-analytics')
export class RetailAnalyticsController {
  constructor(
    private analyticsService: RetailAnalyticsService,
    private prisma: PrismaService,
  ) {}

  private async getBusinessId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.businessId) throw new Error('No business found for user');
    return user.businessId;
  }

  @Get('/summary')
  async getSummary(@Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.analyticsService.getSummary(businessId);
  }

  @Get('/top-products')
  async getTopProducts(@Request() req: any, @Query('limit') limit?: string) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.analyticsService.getTopProducts(
      businessId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('/daily-revenue')
  async getDailyRevenue(@Request() req: any, @Query('days') days?: string) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.analyticsService.getDailyRevenue(
      businessId,
      days ? parseInt(days) : 30,
    );
  }

  @Get('/low-stock')
  async getLowStock(@Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.analyticsService.getLowStockAlerts(businessId);
  }
}
