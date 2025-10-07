import nodemailer from 'nodemailer';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: false, // true for 465, false for other ports
      auth: config.smtpUser && config.smtpPass ? {
        user: config.smtpUser,
        pass: config.smtpPass,
      } : undefined,
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // In development without mailcatcher, just log the email
      if (config.nodeEnv === 'development' && config.smtpHost === 'localhost') {
        logger.info({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || this.htmlToText(options.html),
        }, 'Email would be sent (development mode - no SMTP server)');
        return;
      }

      const mailOptions = {
        from: config.smtpFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info({
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      }, 'Email sent successfully');
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        to: options.to,
        subject: options.subject,
      }, 'Failed to send email');
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, displayName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Gathercomb</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f8f9fa; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Gathercomb!</h1>
            </div>
            <div class="content">
              <h2>Hello ${displayName}!</h2>
              <p>Welcome to Gathercomb, your collaborative sticky notes platform. You can now:</p>
              <ul>
                <li>Create and manage boards</li>
                <li>Add sticky notes with real-time collaboration</li>
                <li>Invite team members to work together</li>
                <li>Access your boards from anywhere</li>
              </ul>
              <p>Get started by creating your first board and inviting your team!</p>
              <a href="http://localhost:3000" class="button">Open Gathercomb</a>
            </div>
            <div class="footer">
              <p>This email was sent from Gathercomb. If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: 'Welcome to Gathercomb!',
      html,
    });
  }

  async sendBoardInviteEmail(
    to: string,
    inviterName: string,
    boardTitle: string,
    boardId: string,
    role: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Board Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f8f9fa; }
            .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .role-badge { display: inline-block; padding: 4px 8px; background-color: #007bff; color: white; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Board Invitation</h1>
            </div>
            <div class="content">
              <h2>You've been invited to collaborate!</h2>
              <p><strong>${inviterName}</strong> has invited you to join the board <strong>"${boardTitle}"</strong> as a <span class="role-badge">${role}</span>.</p>
              <p>Click the button below to access the board and start collaborating:</p>
              <a href="http://localhost:3000/board/${boardId}" class="button">Join Board</a>
              <p>If you don't have an account yet, you'll be prompted to create one first.</p>
            </div>
            <div class="footer">
              <p>This invitation was sent from Gathercomb. If you weren't expecting this invitation, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: `Invitation to join "${boardTitle}"`,
      html,
    });
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

export const emailService = new EmailService();
