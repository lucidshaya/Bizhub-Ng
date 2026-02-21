import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateTransactionDto {
    @IsString()
    type: string;

    @IsString()
    description: string;

    @IsNumber()
    amount: number;

    @IsOptional()
    @IsString()
    channel?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    reference?: string;
}

export class TransactionFilterDto {
    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    channel?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsNumber()
    page?: number;

    @IsOptional()
    @IsNumber()
    limit?: number;
}
