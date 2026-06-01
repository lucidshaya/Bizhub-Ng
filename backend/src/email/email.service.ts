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
        console.log(
          '⚠️ No SMTP/Gmail configured. Emails will be logged to console.',
        );
        this.transporter = null as any;
      }
    }
  }

  private wrapEmailTemplate(
    subject: string,
    content: string,
    businessName?: string,
  ): string {
    const logoLetter = businessName?.charAt(0).toUpperCase() || 'B';
    const name = businessName || 'BizhubNg';

    return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background-color: #f4f7fb; margin: 0; padding: 20px; }
                    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                    .header { background: linear-gradient(135deg, #0A0E1A, #161B27); padding: 40px 32px; text-align: center; }
                    .logo-box { width: 56px; height: 56px; background: linear-gradient(135deg, #00D084, #3B82F6); border-radius: 16px; display: inline-block; line-height: 56px; text-align: center; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0, 208, 132, 0.3); }
                    .logo-text { color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; }
                    .business-name { margin: 0; color: #F1F5F9; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                    .content-area { padding: 40px 32px; background: #ffffff; }
                    .subject { margin-top: 0; margin-bottom: 24px; color: #0F1117; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; text-align: center; }
                    .message { color: #475569; font-size: 16px; line-height: 1.7; }
                    .message a { color: #3B82F6; text-decoration: none; font-weight: 500; }
                    .message p { margin-top: 0; margin-bottom: 16px; }
                    .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0; }
                    .footer-main { margin: 0; color: #64748b; font-size: 14px; font-weight: 500; }
                    .footer-sub { margin: 12px 0 0 0; color: #94a3b8; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-box">
                            <span class="logo-text">${logoLetter}</span>
                        </div>
                        <h2 class="business-name">${name} Updates</h2>
                    </div>
                    
                    <div class="content-area">
                        <h3 class="subject">${subject}</h3>
                        <div class="message">
                            ${content}
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p class="footer-main">
                            You are receiving this communication as a staff member or client of ${name}. 
                        </p>
                        <p class="footer-sub">
                            Powered by BizhubNg — The Operating System for Modern Businesses. <br>
                            &copy; ${new Date().getFullYear()} BizhubNg. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
  }

  async sendInviteEmail(
    to: string,
    staffName: string,
    inviteLink: string,
    businessName?: string,
  ) {
    const subject = `You're invited to join ${businessName || 'BizhubNg'} as staff`;
    const content = `
            <p style="text-align: center; margin-bottom: 24px;">
                Hi <strong>${staffName}</strong>, you've been invited to join
                <strong style="color: #00D084;">${businessName || 'BizhubNg'}</strong> as a staff member.
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
                <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #00D084, #00b872); color: #ffffff; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 208, 132, 0.4);">
                    Accept Invitation
                </a>
            </div>
            <p style="text-align: center; font-size: 14px; color: #64748B;">
                Or copy this link: <br/>
                <a href="${inviteLink}" style="word-break: break-all;">${inviteLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            <p style="text-align: center; font-size: 13px; color: #94A3B8;">
                This invitation was sent from BizhubNg. If you didn't expect this, you can safely ignore it.
            </p>
        `;

    const html = this.wrapEmailTemplate(
      "You're Invited!",
      content,
      businessName,
    );

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
        from:
          process.env.SMTP_FROM ||
          process.env.GMAIL_USER ||
          '"BizhubNg" <noreply@bizhub.ng>',
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

  async sendRawEmail(
    to: string,
    subject: string,
    message: string,
    businessName?: string,
  ) {
    // Simple line break to <br/> conversion and URL parsing for basic markdown-like support
    const formattedMessage = message
      .replace(/\n/g, '<br/>')
      .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" style="color: #3B82F6;">$1</a>',
      );

    const html = this.wrapEmailTemplate(
      subject,
      formattedMessage,
      businessName,
    );

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
        from:
          process.env.SMTP_FROM ||
          process.env.GMAIL_USER ||
          '"BizhubNg" <noreply@bizhub.ng>',
        to,
        subject,
        text: message, // Plain text fallback
        html: html, // Professional HTML template
      });
      console.log(`✅ Email sent to ${to}`);
      return { sent: true };
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      throw error;
    }
  }

  async send2FAEmail(to: string, code: string, userName: string) {
    const subject = 'Your 2FA Login Code - BizhubNg';
    const content = `
            <p style="text-align: center; margin-bottom: 32px;">
                Hi <strong>${userName}</strong>, here is your 2-Factor Authentication code to access your BizhubNg account.
            </p>
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="background: #e2e8f0; border: 2px dashed #00D084; color: #0F1117; font-weight: 800; font-size: 36px; padding: 16px 40px; border-radius: 12px; letter-spacing: 6px; display: inline-block;">
                    ${code}
                </div>
            </div>
            <p style="text-align: center; font-size: 13px; color: #64748b; margin-bottom: 24px; padding: 0 20px;">
                This code will expire in 10 minutes. If you did not attempt to log in, please secure your account immediately by changing your password.
            </p>
        `;

    const html = this.wrapEmailTemplate(
      'Verification Code',
      content,
      'BizhubNg Security',
    );

    if (!this.transporter) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 2FA EMAIL (dev mode)');
      console.log(`To: ${to}`);
      console.log(`Code: ${code}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { sent: false, code };
    }

    try {
      await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          process.env.GMAIL_USER ||
          '"BizhubNg Security" <security@bizhub.ng>',
        to,
        subject,
        html,
      });
      console.log(`✅ 2FA code sent to ${to}`);
      return { sent: true };
    } catch (error: any) {
      console.error(`❌ Failed to send 2FA email to ${to}:`, error.message);
      return { sent: false, reason: error.message };
    }
  }

  async sendRoleChangeEmail(
    to: string,
    name: string,
    oldRole: string,
    newRole: string,
    businessName: string,
  ) {
    const roleLabels: Record<string, string> = {
      ADMIN: 'Sub Admin (Manager)',
      WORKER: 'Worker',
      VIEWER: 'Viewer',
      OWNER: 'Owner',
    };
    const oldLabel = roleLabels[oldRole] || oldRole;
    const newLabel = roleLabels[newRole] || newRole;

    const roleColors: Record<string, string> = {
      ADMIN: '#3B82F6',
      WORKER: '#F59E0B',
      VIEWER: '#8B5CF6',
      OWNER: '#00D084',
    };
    const newColor = roleColors[newRole] || '#00D084';

    const subject = `Your role has been updated on ${businessName}`;
    const content = `
            <p style="text-align: center; margin-bottom: 24px;">
                Hi <strong>${name}</strong>, your role on <strong style="color: #00D084;">${businessName}</strong> has been updated.
            </p>
            <div style="display: flex; gap: 16px; justify-content: center; align-items: center; margin-bottom: 32px; text-align: center;">
                <div style="background: #1E2535; border-radius: 12px; padding: 16px 24px;">
                    <p style="margin: 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Previous Role</p>
                    <p style="margin: 8px 0 0; color: #94A3B8; font-size: 18px; font-weight: 700;">${oldLabel}</p>
                </div>
                <div style="color: #475569; font-size: 24px; font-weight: 300;">→</div>
                <div style="background: ${newColor}15; border: 1px solid ${newColor}40; border-radius: 12px; padding: 16px 24px;">
                    <p style="margin: 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">New Role</p>
                    <p style="margin: 8px 0 0; color: ${newColor}; font-size: 18px; font-weight: 700;">${newLabel}</p>
                </div>
            </div>
            <p style="text-align: center; font-size: 14px; color: #94A3B8;">
                Your access level has changed accordingly. Please log in again to see your updated permissions.
            </p>
            <hr style="border: none; border-top: 1px solid #1E2535; margin: 24px 0;" />
            <p style="text-align: center; font-size: 12px; color: #64748B;">
                If you weren't expecting this change, please contact your business admin immediately.
            </p>
        `;

    const html = this.wrapEmailTemplate(
      'Role Update Notification',
      content,
      businessName,
    );

    if (!this.transporter) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 ROLE CHANGE EMAIL (dev mode)');
      console.log(`To: ${to} | ${oldLabel} → ${newLabel}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { sent: false, reason: 'No SMTP configured' };
    }

    try {
      await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          process.env.GMAIL_USER ||
          '"BizhubNg" <noreply@bizhub.ng>',
        to,
        subject,
        html,
      });
      console.log(`✅ Role change email sent to ${to}`);
      return { sent: true };
    } catch (error: any) {
      console.error(`❌ Failed to send role change email:`, error.message);
      return { sent: false, reason: error.message };
    }
  }
}
