import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsOptional()
    @IsString()
    phone?: string;

    // Business info (created alongside user)
    @IsString()
    @IsNotEmpty()
    businessName: string;

    @IsOptional()
    @IsString()
    businessType?: string;

    @IsOptional()
    @IsString()
    businessAddress?: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class GoogleAuthDto {
    @IsString()
    @IsNotEmpty()
    idToken: string;
}

export class ForgotPasswordDto {
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @MinLength(6)
    newPassword: string;
}

export class AcceptInviteDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsOptional()
    @IsString()
    phone?: string;
}
