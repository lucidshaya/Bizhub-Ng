export class SmsWebhookDto {
    sender: string;
    message: string;
    date?: string;
    apiKey?: string;
    businessId?: string; // Optional if we want to pass it manually via the URL or headers
}
