import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || isNaN(+value) ? 0 : +value,
  )
  @IsNumber()
  monthlySalary?: number;

  @IsOptional()
  @IsString()
  avatarInitials?: string;

  @IsOptional()
  @IsString()
  avatarColor?: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || isNaN(+value) ? 0 : +value,
  )
  @IsNumber()
  monthlySalary?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class PayStaffDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkPayDto {
  @IsOptional()
  @IsString({ each: true })
  staffIds?: string[];

  @IsOptional()
  @IsString()
  reason?: string;
}
