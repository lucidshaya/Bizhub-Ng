import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class WaitlistService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    async joinWaitlist(data: { email: string; businessName: string; industry: string }) {
        // 1. Save to database
        const waitlistEntry = await this.prisma.waitlist.upsert({
            where: { email: data.email },
            update: {
                businessName: data.businessName,
                industry: data.industry,
            },
            create: {
                email: data.email,
                businessName: data.businessName,
                industry: data.industry,
            },
        });

        // 2. Send Alert to Admin
        const adminEmail = 'theskilledlearners@gmail.com';
        const alertSubject = `New Waitlist Signup: ${data.businessName}`;
        const alertMessage = `
      New signup for BizhubNg Waitlist!
      
      Business Name: ${data.businessName}
      Email: ${data.email}
      Industry: ${data.industry}
    `;

        await this.emailService.sendRawEmail(adminEmail, alertSubject, alertMessage);

        // 3. Send Thank You to User
        const userSubject = 'Welcome to the BizhubNg Waitlist!';
        const userHtml = `
      <div style="font-family: 'Sora', sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF0; border-radius: 24px; padding: 48px; border: 4px solid #FFD700;">
        <h1 style="color: #006B3C; font-size: 32px; margin-bottom: 24px;">Thank you for joining the BizhubNg Waitlist!</h1>
        <p style="font-size: 18px; color: #1A1A1A; line-height: 1.6; margin-bottom: 32px;">
          Hi ${data.businessName}, we're thrilled to have you! We're building the future of Nigerian business management, and we'll let you know the moment we launch.
        </p>
        <div style="background: #006B3C; color: #FFD700; padding: 24px; rounded: 16px; text-align: center; font-weight: bold; font-size: 20px;">
          Your spot is reserved. 🚀
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 32px; text-align: center;">
          © ${new Date().getFullYear()} BizhubNg. All rights reserved.
        </p>
      </div>
    `;

        // We can use a custom sendEmail method if it supports HTML, 
        // but the current sendRawEmail only does text. 
        // Let's modify emailService later if needed, but for now we use a formatted text.
        const userMessage = `
      Thank you for joining the BizhubNg Waitlist!
      
      Hi ${data.businessName}, we're thrilled to have you! We're building the future of Nigerian business management, and we'll let you know the moment we launch.
      
      Your spot is reserved. 🚀
      
      © ${new Date().getFullYear()} BizhubNg.
    `;

        await this.emailService.sendRawEmail(data.email, userSubject, userMessage);

        return waitlistEntry;
    }
}
