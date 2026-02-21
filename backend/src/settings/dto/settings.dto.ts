import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;
}

export class UpdateBusinessDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    logoUrl?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    departments?: string[];
}

export class ConnectPaymentDto {
    @IsString()
    provider: string; // "paystack", "flutterwave", "moniepoint", "opay"

    @IsOptional()
    @IsString()
    publicKey?: string;

    @IsOptional()
    @IsString()
    secretKey?: string;

    @IsBoolean()
    connected: boolean;
}
