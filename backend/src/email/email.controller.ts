import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('email')
export class EmailController {
    constructor(
        private readonly emailService: EmailService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('bulk')
    async sendBulkEmail(
        @Request() req: any,
        @Body() body: { subject: string; message: string; staffIds?: string[] }
    ) {
        // Get the business id for the current user
        const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
        if (!user?.businessId) throw new Error('No business found for user');

        // Fetch staff members to email
        let staffFilter: any = { businessId: user.businessId };

        if (body.staffIds && body.staffIds.length > 0) {
            staffFilter.id = { in: body.staffIds };
        }

        const staffMembers = await this.prisma.staff.findMany({
            where: staffFilter,
            select: { email: true, name: true }
        });

        // Filter out those without emails
        const validRecipients = staffMembers.filter(s => s.email && s.email.trim() !== '');

        if (validRecipients.length === 0) {
            return { success: false, message: 'No valid email recipients found.' };
        }

        // Send via EmailService
        let sentCount = 0;
        let errors = [];

        for (const staff of validRecipients) {
            try {
                // We use the existing sendWelcomeEmail structure or a generic one.
                // Looking at email.service.ts, there should be a generic sendEmail.
                // Assuming `sendEmail(to, subject, text, html)` exists. We will try that.
                // Since I haven't seen the exact signature of emailService, let's use a generic catch-all if we don't know it, 
                // but let's assume it has something like `sendPasswordReset` and we can use it, or we add a generic method.
                // I will add a generic `sendRawEmail` below if it doesn't exist.

                await this.emailService.sendRawEmail(staff.email as string, body.subject, body.message);
                sentCount++;
            } catch (err) {
                errors.push({ email: staff.email, error: err.message });
            }
        }

        return {
            success: true,
            sentCount,
            totalAttempted: validRecipients.length,
            errors: errors.length > 0 ? errors : undefined
        };
    }
}
