import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/sales.dto';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  private async assertRetailStore(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    if ((business as any).storeMode !== 'RETAIL_STORE') {
      throw new ForbiddenException(
        'Sales module is only available for Retail Store mode',
      );
    }
    return business;
  }

  async createSale(businessId: string, cashierId: string, dto: CreateSaleDto) {
    await this.assertRetailStore(businessId);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Sale must have at least one item');
    }

    // Load all products in one query
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, businessId },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products not found in this business',
      );
    }

    // Validate stock for all items
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`,
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    const saleItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const itemSubtotal = product.sellingPrice * item.quantity;
      subtotal += itemSubtotal;
      return {
        productId: item.productId,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        subtotal: itemSubtotal,
      };
    });

    let discount = dto.discount ?? 0;
    if (dto.discountType === 'percentage') {
      discount = Math.round((subtotal * discount) / 100);
    }
    const total = Math.max(0, subtotal - discount);

    // Atomic transaction: create sale + deduct stock + log movements
    const sale = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          businessId,
          cashierId,
          subtotal,
          discount,
          discountType: dto.discountType ?? 'fixed',
          paymentMethod: dto.paymentMethod,
          total,
          items: {
            create: saleItems,
          },
        },
        include: { items: true },
      });

      // Deduct stock and log
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: StockMovementType.SALE,
            quantityDelta: -item.quantity,
            reason: `Sale #${created.id.substring(0, 8)}`,
            businessId,
          },
        });
      }

      return created;
    });

    return {
      ...sale,
      subtotalNaira: sale.subtotal / 100,
      discountNaira: sale.discount / 100,
      totalNaira: sale.total / 100,
      items: sale.items.map((i) => ({
        ...i,
        unitPriceNaira: i.unitPrice / 100,
        subtotalNaira: i.subtotal / 100,
      })),
    };
  }

  async getSales(
    businessId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      paymentMethod?: string;
      cashierId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (params?.paymentMethod) where.paymentMethod = params.paymentMethod;
    if (params?.cashierId) where.cashierId = params.cashierId;
    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          items: {
            include: { product: { select: { name: true, unit: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales.map((s) => ({
        ...s,
        totalNaira: s.total / 100,
        subtotalNaira: s.subtotal / 100,
        discountNaira: s.discount / 100,
        items: s.items.map((i) => ({
          ...i,
          unitPriceNaira: i.unitPrice / 100,
          subtotalNaira: i.subtotal / 100,
        })),
      })),
      total,
      page,
      pageCount: Math.ceil(total / limit),
    };
  }

  async getSale(id: string, businessId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, businessId },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return {
      ...sale,
      totalNaira: sale.total / 100,
      subtotalNaira: sale.subtotal / 100,
      discountNaira: sale.discount / 100,
      items: sale.items.map((i) => ({
        ...i,
        unitPriceNaira: i.unitPrice / 100,
        subtotalNaira: i.subtotal / 100,
      })),
    };
  }

  async getSalesSummary(
    businessId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { businessId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [sales, count] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        select: { total: true, paymentMethod: true },
      }),
      this.prisma.sale.count({ where }),
    ]);

    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const byMethod: Record<string, number> = {};
    for (const s of sales) {
      byMethod[s.paymentMethod] = (byMethod[s.paymentMethod] || 0) + s.total;
    }

    return {
      totalSales: count,
      totalRevenue: totalRevenue / 100,
      byPaymentMethod: Object.entries(byMethod).map(([method, amount]) => ({
        method,
        amount: amount / 100,
        count: sales.filter((s) => s.paymentMethod === method).length,
      })),
    };
  }
}
