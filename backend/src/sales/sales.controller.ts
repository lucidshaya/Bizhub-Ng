import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/sales.dto';

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller('sales')
export class SalesController {
  constructor(
    private salesService: SalesService,
    private prisma: PrismaService,
  ) {}

  private async getBusinessId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.businessId) throw new Error('No business found for user');
    return user.businessId;
  }

  @Post('/')
  async createSale(@Body() dto: CreateSaleDto, @Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.salesService.createSale(businessId, req.user.sub, dto);
  }

  @Get('/')
  async getSales(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.salesService.getSales(businessId, {
      startDate,
      endDate,
      paymentMethod,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('/summary')
  async getSummary(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.salesService.getSalesSummary(businessId, startDate, endDate);
  }

  @Get('/:id')
  async getSale(@Param('id') id: string, @Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.salesService.getSale(id, businessId);
  }
}
