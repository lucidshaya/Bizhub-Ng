import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { InventoryService } from './inventory.service';
import {
  CreateProductDto,
  UpdateProductDto,
  StockAdjustmentDto,
} from './dto/inventory.dto';

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private inventoryService: InventoryService,
    private prisma: PrismaService,
  ) {}

  private async getBusinessId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.businessId) throw new Error('No business found for user');
    return user.businessId;
  }

  @Get('/products')
  async getProducts(
    @Request() req: RequestWithUser,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.inventoryService.getProducts(
      businessId,
      search,
      category,
      lowStock === 'true',
    );
  }

  @Get('/products/categories')
  async getCategories(@Request() req: RequestWithUser) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.inventoryService.getCategories(businessId);
  }

  @Get('/products/low-stock')
  async getLowStock(@Request() req: RequestWithUser) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.inventoryService.getLowStockProducts(businessId);
  }

  @Get('/products/:id')
  async getProduct(@Param('id') id: string, @Request() req: RequestWithUser) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.inventoryService.getProduct(id, businessId);
  }

  @Post('/products')
  async createProduct(
    @Body() dto: CreateProductDto,
    @Request() req: RequestWithUser,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.inventoryService.createProduct(businessId, dto);
  }

  @Patch('/products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Request() req: RequestWithUser,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.inventoryService.updateProduct(id, businessId, dto);
  }

  @Delete('/products/:id')
  async deleteProduct(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.inventoryService.deleteProduct(id, businessId);
  }

  @Post('/products/:id/adjust-stock')
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: StockAdjustmentDto,
    @Request() req: RequestWithUser,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.inventoryService.adjustStock(id, businessId, dto);
  }

  @Get('/products/:id/movements')
  async getMovements(@Param('id') id: string, @Request() req: RequestWithUser) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.inventoryService.getStockMovements(id, businessId);
  }

  @Post('/import-csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCSV(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('CSV file is required');
    const businessId = await this.getBusinessId(req.user.sub);
    const csvData = file.buffer.toString('utf-8');
    return this.inventoryService.bulkImportCSV(businessId, csvData);
  }
}
