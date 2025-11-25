import { Resend } from "resend";
import { EMAIL_CONFIG, VERIFICATION_CODE_EXPIRY_MINUTES } from "./constants";

/**
 * Email service utilities
 */
export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    // Initialize Resend lazily to avoid issues during deployment
  }

  private getResend(): Resend {
    if (!this.resend) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    return this.resend;
  }

  /**
   * Generate a random 6-digit verification code
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const { error } = await this.getResend().emails.send({
      from: EMAIL_CONFIG.FROM,
      to: email,
      subject: EMAIL_CONFIG.SUBJECT,
      html: this.getVerificationEmailTemplate(code),
    });

    if (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  /**
   * Get verification email HTML template
   */
  private getVerificationEmailTemplate(code: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Verify Your Email</h1>
        <p>Welcome to Dream Journal! Please verify your email address by entering this code:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h2 style="color: #1f2937; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h2>
        </div>
        <p>This code will expire in ${VERIFICATION_CODE_EXPIRY_MINUTES} minutes.</p>
        <p>If you didn't request this verification, you can safely ignore this email.</p>
      </div>
    `;
  }
}
