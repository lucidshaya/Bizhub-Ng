import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  StockAdjustmentDto,
} from './dto/inventory.dto';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private async assertRetailStore(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    if ((business as any).storeMode !== 'RETAIL_STORE') {
      throw new ForbiddenException(
        'Inventory is only available for Retail Store mode',
      );
    }
    return business;
  }

  async getProducts(
    businessId: string,
    search?: string,
    category?: string,
    lowStock?: boolean,
  ) {
    await this.assertRetailStore(businessId);

    const where: any = { businessId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (lowStock) {
      where.quantity = {
        lte: this.prisma.$queryRaw`"quantity" <= "low_stock_threshold"` as any,
      };
    }

    const products = await this.prisma.product.findMany({
      where: lowStock
        ? {
            businessId,
            ...(search
              ? {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {}),
            ...(category ? { category } : {}),
          }
        : where,
      orderBy: { createdAt: 'desc' },
    });

    // Filter low stock after query if flag set
    const filtered = lowStock
      ? products.filter((p) => p.quantity <= p.lowStockThreshold)
      : products;

    return filtered.map((p) => ({
      ...p,
      sellingPriceNaira: p.sellingPrice / 100,
      costPriceNaira: p.costPrice / 100,
      isLowStock: p.quantity <= p.lowStockThreshold,
    }));
  }

  async getProduct(id: string, businessId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return {
      ...product,
      sellingPriceNaira: product.sellingPrice / 100,
      costPriceNaira: product.costPrice / 100,
      isLowStock: product.quantity <= product.lowStockThreshold,
    };
  }

  async createProduct(businessId: string, dto: CreateProductDto) {
    await this.assertRetailStore(businessId);

    // Check uniqueness
    if (dto.sku) {
      const existing = await this.prisma.product.findFirst({
        where: { sku: dto.sku, businessId },
      });
      if (existing)
        throw new BadRequestException(`SKU "${dto.sku}" already exists`);
    }
    if (dto.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: { barcode: dto.barcode, businessId },
      });
      if (existing)
        throw new BadRequestException(
          `Barcode "${dto.barcode}" already in use`,
        );
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        barcode: dto.barcode,
        category: dto.category,
        sellingPrice: dto.sellingPrice,
        costPrice: dto.costPrice,
        quantity: dto.quantity,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        unit: dto.unit ?? 'piece',
        businessId,
      },
    });

    // Log initial stock if quantity > 0
    if (dto.quantity > 0) {
      await this.prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: StockMovementType.RESTOCK,
          quantityDelta: dto.quantity,
          reason: 'Initial stock',
          businessId,
        },
      });
    }

    return {
      ...product,
      sellingPriceNaira: product.sellingPrice / 100,
      costPriceNaira: product.costPrice / 100,
    };
  }

  async updateProduct(id: string, businessId: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.barcode !== undefined && { barcode: dto.barcode }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.sellingPrice !== undefined && {
          sellingPrice: dto.sellingPrice,
        }),
        ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
        ...(dto.lowStockThreshold !== undefined && {
          lowStockThreshold: dto.lowStockThreshold,
        }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
      },
    });
    return {
      ...updated,
      sellingPriceNaira: updated.sellingPrice / 100,
      costPriceNaira: updated.costPrice / 100,
    };
  }

  async deleteProduct(id: string, businessId: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!existing) throw new NotFoundException('Product not found');
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  async adjustStock(id: string, businessId: string, dto: StockAdjustmentDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const newQty = product.quantity + dto.quantityDelta;
    if (newQty < 0) {
      throw new BadRequestException(
        `Cannot reduce stock below 0. Current: ${product.quantity}, delta: ${dto.quantityDelta}`,
      );
    }

    const [updatedProduct] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id },
        data: { quantity: newQty },
      }),
      this.prisma.stockMovement.create({
        data: {
          productId: id,
          type: dto.type as StockMovementType,
          quantityDelta: dto.quantityDelta,
          reason: dto.reason,
          businessId,
        },
      }),
    ]);

    return {
      ...updatedProduct,
      isLowStock: updatedProduct.quantity <= updatedProduct.lowStockThreshold,
    };
  }

  async getStockMovements(productId: string, businessId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.stockMovement.findMany({
      where: { productId, businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getLowStockProducts(businessId: string) {
    await this.assertRetailStore(businessId);
    const products = await this.prisma.product.findMany({
      where: { businessId },
    });
    return products
      .filter((p) => p.quantity <= p.lowStockThreshold)
      .map((p) => ({
        ...p,
        sellingPriceNaira: p.sellingPrice / 100,
        costPriceNaira: p.costPrice / 100,
      }));
  }

  async bulkImportCSV(businessId: string, csvData: string) {
    await this.assertRetailStore(businessId);

    const lines = csvData.trim().split('\n');
    if (lines.length < 2)
      throw new BadRequestException(
        'CSV must have a header row and at least one data row',
      );

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const skuIdx = headers.indexOf('sku');
    const barcodeIdx = headers.indexOf('barcode');
    const categoryIdx = headers.indexOf('category');
    const sellingIdx = headers.findIndex((h) => h.includes('selling'));
    const costIdx = headers.findIndex((h) => h.includes('cost'));
    const qtyIdx = headers.findIndex(
      (h) => h.includes('qty') || h.includes('quantity'),
    );
    const unitIdx = headers.indexOf('unit');

    if (nameIdx === -1)
      throw new BadRequestException('CSV must have a "name" column');

    const results: { success: number; skipped: number; errors: string[] } = {
      success: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]
        .split(',')
        .map((c) => c.trim().replace(/^"|"$/g, ''));
      const name = cols[nameIdx];
      if (!name) {
        results.skipped++;
        continue;
      }

      const sku = skuIdx >= 0 ? cols[skuIdx] || undefined : undefined;
      const sellingPrice =
        sellingIdx >= 0
          ? Math.round(parseFloat(cols[sellingIdx] || '0') * 100)
          : 0;
      const costPrice =
        costIdx >= 0 ? Math.round(parseFloat(cols[costIdx] || '0') * 100) : 0;
      const quantity = qtyIdx >= 0 ? parseInt(cols[qtyIdx] || '0') : 0;

      try {
        if (sku) {
          // Upsert by SKU
          await this.prisma.product.upsert({
            where: { sku },
            update: { name, sellingPrice, costPrice, quantity },
            create: {
              name,
              sku,
              barcode:
                barcodeIdx >= 0 ? cols[barcodeIdx] || undefined : undefined,
              category:
                categoryIdx >= 0 ? cols[categoryIdx] || undefined : undefined,
              sellingPrice,
              costPrice,
              quantity,
              unit: unitIdx >= 0 ? cols[unitIdx] || 'piece' : 'piece',
              businessId,
            },
          });
        } else {
          await this.prisma.product.create({
            data: {
              name,
              category:
                categoryIdx >= 0 ? cols[categoryIdx] || undefined : undefined,
              sellingPrice,
              costPrice,
              quantity,
              unit: unitIdx >= 0 ? cols[unitIdx] || 'piece' : 'piece',
              businessId,
            },
          });
        }
        results.success++;
      } catch (e: any) {
        results.errors.push(`Row ${i + 1}: ${e.message}`);
        results.skipped++;
      }
    }

    return results;
  }

  async getCategories(businessId: string) {
    const products = await this.prisma.product.findMany({
      where: { businessId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return products.map((p) => p.category).filter(Boolean);
  }
}
