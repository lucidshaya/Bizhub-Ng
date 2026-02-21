import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Use Gmail SMTP or any SMTP provider
        // For development: uses Ethereal (test email service) if no SMTP configured
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (smtpHost && smtpUser && smtpPass) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user: smtpUser, pass: smtpPass },
            });
        } else {
            // Fallback: Gmail App Password (simplest setup)
            const gmailUser = process.env.GMAIL_USER;
            const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

            if (gmailUser && gmailAppPassword) {
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: gmailUser, pass: gmailAppPassword },
                });
            } else {
                // Dev fallback: log emails to console
                console.log('⚠️ No SMTP/Gmail configured. Emails will be logged to console.');
                this.transporter = null as any;
            }
        }
    }

    async sendInviteEmail(to: string, staffName: string, inviteLink: string, businessName?: string) {
        const subject = `You're invited to join ${businessName || 'BizhubNg'} as staff`;
        const html = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0F1117; border-radius: 16px; padding: 40px; color: #F1F5F9;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #00D084, #3B82F6); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white;">B</div>
                </div>
                <h2 style="color: #F1F5F9; text-align: center; margin-bottom: 8px; font-size: 20px;">You're Invited!</h2>
                <p style="color: #94A3B8; text-align: center; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                    Hi <strong style="color: #F1F5F9;">${staffName}</strong>, you've been invited to join
                    <strong style="color: #00D084;">${businessName || 'BizhubNg'}</strong> as a staff member.
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #00D084, #00b872); color: #0F1117; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px;">
                        Accept Invitation
                    </a>
                </div>
                <p style="color: #475569; text-align: center; font-size: 12px;">
                    Or copy this link: <br/>
                    <a href="${inviteLink}" style="color: #3B82F6; word-break: break-all;">${inviteLink}</a>
                </p>
                <hr style="border: none; border-top: 1px solid #1E2535; margin: 24px 0;" />
                <p style="color: #475569; text-align: center; font-size: 11px;">
                    This invitation was sent from BizhubNg. If you didn't expect this, you can ignore it.
                </p>
            </div>
        `;

        if (!this.transporter) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 INVITATION EMAIL (dev mode)');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Link: ${inviteLink}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return { sent: false, reason: 'No SMTP configured', inviteLink };
        }

        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.GMAIL_USER || '"BizhubNg" <noreply@bizhub.ng>',
                to,
                subject,
                html,
            });
            console.log(`✅ Invitation email sent to ${to}`);
            return { sent: true };
        } catch (error: any) {
            console.error(`❌ Failed to send email to ${to}:`, error.message);
            return { sent: false, reason: error.message, inviteLink };
        }
    }

    async sendRawEmail(to: string, subject: string, message: string) {
        if (!this.transporter) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 RAW EMAIL (dev mode)');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Message: ${message}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return { sent: false, reason: 'No SMTP configured' };
        }

        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.GMAIL_USER || '"BizhubNg" <noreply@bizhub.ng>',
                to,
                subject,
                text: message, // Use plain text or HTML for bulk emails
            });
            console.log(`✅ Email sent to ${to}`);
            return { sent: true };
        } catch (error: any) {
            console.error(`❌ Failed to send email to ${to}:`, error.message);
            throw error;
        }
    }
}
