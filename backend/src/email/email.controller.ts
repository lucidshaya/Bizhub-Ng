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
  ) {}

  @Post('bulk')
  async sendBulkEmail(
    @Request() req: any,
    @Body() body: { subject: string; message: string; staffIds?: string[] },
  ) {
    // Get the business id for the current user
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    if (!user?.businessId) throw new Error('No business found for user');

    // Fetch staff members to email
    const staffFilter: any = { businessId: user.businessId };

    if (body.staffIds && body.staffIds.length > 0) {
      staffFilter.id = { in: body.staffIds };
    }

    const staffMembers = await this.prisma.staff.findMany({
      where: staffFilter,
      select: { email: true, name: true },
    });

    // Fetch business name for email template
    const business = await this.prisma.business.findUnique({
      where: { id: user.businessId },
    });

    // Filter out those without emails
    const validRecipients = staffMembers.filter(
      (s) => s.email && s.email.trim() !== '',
    );

    if (validRecipients.length === 0) {
      return { success: false, message: 'No valid email recipients found.' };
    }

    // Send via EmailService
    let sentCount = 0;
    const errors = [];

    for (const staff of validRecipients) {
      try {
        await this.emailService.sendRawEmail(
          staff.email as string,
          body.subject,
          body.message,
          business?.name,
        );
        sentCount++;
      } catch (err: any) {
        errors.push({ email: staff.email, error: err.message });
      }
    }

    return {
      success: true,
      sentCount,
      totalAttempted: validRecipients.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
