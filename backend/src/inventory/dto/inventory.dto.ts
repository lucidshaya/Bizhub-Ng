import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsPositive,
  Min,
  IsEnum,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsInt()
  @Min(0)
  sellingPrice: number; // kobo

  @IsInt()
  @Min(0)
  costPrice: number; // kobo

  @IsInt()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsString()
  unit?: string; // piece, kg, litre, carton
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class StockAdjustmentDto {
  @IsEnum(['RESTOCK', 'ADJUSTMENT', 'DAMAGED'])
  type: 'RESTOCK' | 'ADJUSTMENT' | 'DAMAGED';

  @IsInt()
  quantityDelta: number; // can be negative for DAMAGED/ADJUSTMENT

  @IsOptional()
  @IsString()
  reason?: string;
}
