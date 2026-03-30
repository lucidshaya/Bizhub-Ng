import { Controller, Post, Get, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InitializePaymentDto, VerifyPaymentDto, WithdrawDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
    constructor(private payments: PaymentsService) { }

    // ─── PAYSTACK ─────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post('paystack/initialize')
    async paystackInit(@Req() req: any, @Body() dto: InitializePaymentDto) {
        return this.payments.paystackInitialize(req.user.id, dto.amount, dto.email, dto.description);
    }

    @UseGuards(JwtAuthGuard)
    @Post('paystack/verify')
    async paystackVerify(@Body() dto: VerifyPaymentDto) {
        return this.payments.paystackVerify(dto.reference);
    }

    @UseGuards(JwtAuthGuard)
    @Post('paystack/verify-funding')
    async paystackVerifyFunding(@Req() req: any, @Body() dto: VerifyPaymentDto) {
        return this.payments.verifyWalletFunding(dto.reference, req.user.sub); 
    }

    @Post('paystack/webhook')
    @HttpCode(200)
    async paystackWebhook(@Body() body: any) {
        await this.payments.paystackWebhook(body);
        return { received: true };
    }

    // ─── FLUTTERWAVE ──────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post('flutterwave/initialize')
    async flutterwaveInit(@Req() req: any, @Body() dto: InitializePaymentDto) {
        return this.payments.flutterwaveInitialize(req.user.id, dto.amount, dto.email, dto.description);
    }

    @UseGuards(JwtAuthGuard)
    @Post('flutterwave/verify')
    async flutterwaveVerify(@Body() dto: VerifyPaymentDto) {
        return this.payments.flutterwaveVerify(dto.reference);
    }

    // ─── MONIEPOINT ───────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post('moniepoint/virtual-account')
    async moniepointVirtualAccount(@Req() req: any, @Body() body: { name: string; email: string }) {
        return this.payments.moniepointCreateVirtualAccount(req.user.id, body.name, body.email);
    }

    // ─── OPAY ─────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post('opay/transfer')
    async opayTransfer(@Req() req: any, @Body() dto: WithdrawDto) {
        return this.payments.opayTransfer(req.user.id, dto.amount, dto.bankCode, dto.accountNumber, dto.accountName);
    }

    // ─── BANKS ────────────────────────────────────────────

    @Get('banks')
    async getBanks() {
        return this.payments.getBanks();
    }
}
