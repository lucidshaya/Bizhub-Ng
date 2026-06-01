import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetailAnalyticsService {
  constructor(private prisma: PrismaService) {}

  private async assertRetailStore(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    if ((business as any).storeMode !== 'RETAIL_STORE') {
      throw new ForbiddenException(
        'Analytics is only available for Retail Store mode',
      );
    }
    return business;
  }

  async getSummary(businessId: string) {
    const business = await this.assertRetailStore(businessId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const [todaySales, thisMonthSales, allSales, products] = await Promise.all([
      this.prisma.sale.findMany({
        where: { businessId, createdAt: { gte: todayStart, lte: todayEnd } },
        select: { total: true, subtotal: true },
      }),
      this.prisma.sale.findMany({
        where: { businessId, createdAt: { gte: thisMonthStart } },
        select: { total: true },
      }),
      this.prisma.sale.findMany({
        where: { businessId },
        include: {
          items: { include: { product: { select: { costPrice: true } } } },
        },
      }),
      this.prisma.product.findMany({ where: { businessId } }),
    ]);

    const todayRevenue = todaySales.reduce((s, x) => s + x.total, 0);
    const monthRevenue = thisMonthSales.reduce((s, x) => s + x.total, 0);

    // Gross profit: revenue - COGS
    let totalRevenue = 0,
      totalCOGS = 0;
    for (const sale of allSales) {
      totalRevenue += sale.total;
      for (const item of sale.items) {
        totalCOGS += (item.product?.costPrice ?? 0) * item.quantity;
      }
    }

    const stockValue = products.reduce(
      (s, p) => s + p.costPrice * p.quantity,
      0,
    );
    const lowStockCount = products.filter(
      (p) => p.quantity <= p.lowStockThreshold,
    ).length;

    return {
      todayRevenue: todayRevenue / 100,
      todaySalesCount: todaySales.length,
      monthRevenue: monthRevenue / 100,
      totalRevenue: totalRevenue / 100,
      grossProfit: (totalRevenue - totalCOGS) / 100,
      grossMargin:
        totalRevenue > 0
          ? Math.round(((totalRevenue - totalCOGS) / totalRevenue) * 100)
          : 0,
      stockValue: stockValue / 100,
      totalProducts: products.length,
      lowStockCount,
    };
  }

  async getTopProducts(businessId: string, limit = 10) {
    await this.assertRetailStore(businessId);

    const saleItems = await this.prisma.saleItem.findMany({
      where: { sale: { businessId } },
      include: { product: { select: { name: true, category: true } } },
    });

    const productMap = new Map<
      string,
      {
        name: string;
        category: string | null;
        totalQty: number;
        totalRevenue: number;
      }
    >();
    for (const item of saleItems) {
      const existing = productMap.get(item.productId) ?? {
        name: item.name,
        category: item.product?.category ?? null,
        totalQty: 0,
        totalRevenue: 0,
      };
      existing.totalQty += item.quantity;
      existing.totalRevenue += item.subtotal;
      productMap.set(item.productId, existing);
    }

    return Array.from(productMap.entries())
      .map(([id, data]) => ({
        productId: id,
        ...data,
        totalRevenueNaira: data.totalRevenue / 100,
      }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, limit);
  }

  async getDailyRevenue(businessId: string, days = 30) {
    await this.assertRetailStore(businessId);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const sales = await this.prisma.sale.findMany({
      where: { businessId, createdAt: { gte: since } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, number>();
    for (const sale of sales) {
      const key = sale.createdAt.toISOString().split('T')[0];
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + sale.total);
    }

    return Array.from(dailyMap.entries()).map(([date, revenue]) => ({
      date,
      revenue: revenue / 100,
    }));
  }

  async getLowStockAlerts(businessId: string) {
    await this.assertRetailStore(businessId);

    const products = await this.prisma.product.findMany({
      where: { businessId },
    });
    return products
      .filter((p) => p.quantity <= p.lowStockThreshold)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        quantity: p.quantity,
        lowStockThreshold: p.lowStockThreshold,
        sellingPriceNaira: p.sellingPrice / 100,
      }))
      .sort((a, b) => a.quantity - b.quantity);
  }
}
