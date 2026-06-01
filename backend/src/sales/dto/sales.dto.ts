import {
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  discount?: number; // kobo

  @IsOptional()
  @IsEnum(['fixed', 'percentage'])
  discountType?: 'fixed' | 'percentage';

  @IsEnum(['cash', 'card', 'transfer'])
  paymentMethod: 'cash' | 'card' | 'transfer';
}
