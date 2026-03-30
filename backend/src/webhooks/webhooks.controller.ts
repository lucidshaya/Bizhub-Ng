import { Controller, Post, Body, HttpCode, HttpStatus, Req, Headers, Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import type { Request } from 'express';

@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(private readonly webhooksService: WebhooksService) { }

    @Post('pos')
    @HttpCode(HttpStatus.OK)
    async handlePosWebhook(
        @Body() body: any,
        @Req() req: Request,
        @Headers() headers: Record<string, string>
    ) {
        this.logger.log(`Received POS Webhook: ${JSON.stringify(body)}`);

        // This is a generic endpoint that providers like Moniepoint or OPay POS can hit.
        // We will attempt to parse standard Nigerian POS provider payloads.
        try {
            await this.webhooksService.processPosTransaction(body, headers);
            return { success: true, message: 'Webhook received' };
        } catch (error) {
            this.logger.error(`Error processing POS webhook: ${error.message}`);
            // Still return 200 OK so the provider doesn't keep retrying unnecessarily,
            // unless it's a critical validation error we want them to retry.
            return { success: false, message: error.message };
        }
    }

    @Post('opay')
    @HttpCode(HttpStatus.OK)
    async handleOpayWebhook(
        @Body() body: any,
        @Req() req: Request,
        @Headers() headers: Record<string, string>
    ) {
        this.logger.log(`Received OPay Webhook: ${JSON.stringify(body)}`);

        try {
            await this.webhooksService.processOpayTransaction(body, headers);
            return { success: true, message: 'Webhook received' };
        } catch (error) {
            this.logger.error(`Error processing OPay webhook: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    @Post('monnify')
    @HttpCode(HttpStatus.OK)
    async handleMonnifyWebhook(
        @Body() body: any,
        @Req() req: Request,
        @Headers() headers: Record<string, string>
    ) {
        this.logger.log(`Received Monnify Webhook: ${JSON.stringify(body)}`);

        try {
            await this.webhooksService.processMonnifyTransaction(body, headers);
            return { success: true, message: 'Webhook received' };
        } catch (error) {
            this.logger.error(`Error processing Monnify webhook: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    @Post('sms')
    @HttpCode(HttpStatus.OK)
    async handleSmsWebhook(
        @Body() body: any,
        @Req() req: Request
    ) {
        this.logger.log(`Received SMS Webhook: ${JSON.stringify(body)}`);
        
        try {
            const parsed = await this.webhooksService.processSmsAlert(body);
            return { 
                success: true, 
                message: parsed ? 'SMS Parsed correctly and Logged' : 'SMS Webhook received but discarded (Not a valid credit alert)',
                data: parsed
            };
        } catch (error) {
            this.logger.error(`Error processing SMS webhook: ${error.message}`);
            return { success: false, message: error.message };
        }
    }
}
