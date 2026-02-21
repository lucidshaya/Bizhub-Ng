import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export enum PaymentProvider {
    PAYSTACK = 'PAYSTACK',
    FLUTTERWAVE = 'FLUTTERWAVE',
    MONIEPOINT = 'MONIEPOINT',
    OPAY = 'OPAY',
}

export class InitializePaymentDto {
    @IsNumber()
    @Min(100)
    amount: number;

    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    reference?: string;

    @IsOptional()
    @IsString()
    callbackUrl?: string;

    @IsOptional()
    @IsEnum(PaymentProvider)
    provider?: PaymentProvider = PaymentProvider.PAYSTACK;

    @IsOptional()
    @IsString()
    description?: string;
}

export class VerifyPaymentDto {
    @IsString()
    reference: string;

    @IsOptional()
    @IsEnum(PaymentProvider)
    provider?: PaymentProvider = PaymentProvider.PAYSTACK;
}

export class WithdrawDto {
    @IsNumber()
    @Min(100)
    amount: number;

    @IsString()
    bankCode: string;

    @IsString()
    accountNumber: string;

    @IsOptional()
    @IsString()
    accountName?: string;

    @IsOptional()
    @IsEnum(PaymentProvider)
    provider?: PaymentProvider = PaymentProvider.PAYSTACK;
}
