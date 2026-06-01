import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { MonoService } from './mono.service';
import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly monoService: MonoService,
  ) {}

  // ─── PAYSTACK HMAC Validation ─────────────────────────────────────────────
  private verifyPaystackSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    if (!secret || !signature) return false;
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
    try {
      return timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  // ─── MONO HMAC Validation ────────────────────────────────────────────────
  private verifyMonoSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.MONO_WEBHOOK_SECRET || '';
    if (!secret || !signature) return false;
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
    try {
      return timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  @Post('pos')
  @HttpCode(HttpStatus.OK)
  async handlePosWebhook(@Body() body: any) {
    this.logger.log(`Received POS Webhook: ${JSON.stringify(body)}`);
    try {
      await this.webhooksService.processPosTransaction(body);
      return { success: true, message: 'Webhook received' };
    } catch (error) {
      this.logger.error(`Error processing POS webhook: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Post('opay')
  @HttpCode(HttpStatus.OK)
  async handleOpayWebhook(@Body() body: any) {
    this.logger.log(`Received OPay Webhook: ${JSON.stringify(body)}`);
    try {
      await this.webhooksService.processOpayTransaction(body);
      return { success: true, message: 'Webhook received' };
    } catch (error) {
      this.logger.error(`Error processing OPay webhook: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Post('monnify')
  @HttpCode(HttpStatus.OK)
  async handleMonnifyWebhook(@Body() body: any) {
    this.logger.log(`Received Monnify Webhook: ${JSON.stringify(body)}`);
    try {
      await this.webhooksService.processMonnifyTransaction(body);
      return { success: true, message: 'Webhook received' };
    } catch (error) {
      this.logger.error(`Error processing Monnify webhook: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Post('sms')
  @HttpCode(HttpStatus.OK)
  async handleSmsWebhook(@Body() body: any, @Req() req: Request) {
    this.logger.log(`Received SMS Webhook: ${JSON.stringify(body)}`);
    try {
      const parsed = await this.webhooksService.processSmsAlert(body);
      return {
        success: true,
        message: parsed
          ? 'SMS Parsed correctly and Logged'
          : 'SMS Webhook received but discarded (Not a valid credit alert)',
        data: parsed,
      };
    } catch (error) {
      this.logger.error(`Error processing SMS webhook: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // ─── PAYSTACK Webhook (HMAC-validated) ────────────────────────────────────
  @Post('paystack')
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(
    @Body() body: any,
    @Req() req: Request,
    @Headers('x-paystack-signature') signature: string,
  ) {
    this.logger.log(`Received Paystack Webhook: event=${body?.event}`);

    // Validate HMAC signature — reject requests with invalid signatures
    const rawBody = JSON.stringify(body);
    if (!this.verifyPaystackSignature(rawBody, signature)) {
      this.logger.warn('Paystack webhook signature validation FAILED');
      throw new UnauthorizedException('Invalid Paystack webhook signature');
    }

    const event = body.event as string;

    try {
      if (event === 'charge.success') {
        // Wallet funding via Paystack inline (already handled via verify-funding)
        this.logger.log(`Paystack charge.success: ref=${body.data?.reference}`);
      } else if (event === 'transfer.success') {
        this.logger.log(
          `Paystack transfer.success: ref=${body.data?.reference}`,
        );
        // Future: update StaffPayout status to SUCCESS
      } else if (event === 'transfer.failed') {
        this.logger.warn(
          `Paystack transfer.failed: ref=${body.data?.reference}`,
        );
        // Future: update StaffPayout status to FAILED, refund wallet
      } else {
        this.logger.log(`Unhandled Paystack event: ${event}`);
      }
      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing Paystack webhook: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // ─── MONO Webhook (HMAC-validated) ────────────────────────────────────────
  @Post('mono')
  @HttpCode(HttpStatus.OK)
  async handleMonoWebhook(
    @Body() body: any,
    @Req() req: Request,
    @Headers('mono-webhook-secret') signature: string,
  ) {
    this.logger.log(`Received Mono Webhook: ${JSON.stringify(body)}`);

    // Validate HMAC signature
    const rawBody = JSON.stringify(body);
    const monoSecretEnv = process.env.MONO_WEBHOOK_SECRET;
    if (monoSecretEnv && !this.verifyMonoSignature(rawBody, signature)) {
      this.logger.warn('Mono webhook signature validation FAILED');
      throw new UnauthorizedException('Invalid Mono webhook signature');
    }

    const event = body.event;
    const accountId = body.data?.account?._id || body.data?.account?.id;

    if (event === 'mono.events.account_updated' && accountId) {
      this.logger.log(
        `Mono account updated: ${accountId}. Triggering transaction fetch...`,
      );
      // Fire and forget so we don't time out the webhook
      this.monoService.fetchAndProcessTransactions(accountId).catch((err) => {
        this.logger.error(`Background Mono sync failed: ${err.message}`);
      });
    }

    return { success: true };
  }
}
