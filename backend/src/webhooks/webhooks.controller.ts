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
}
