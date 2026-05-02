import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getExpiryTime(): string {
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return expiry.toISOString();
}

export function isCodeExpired(expiryStr: string): boolean {
  return new Date() > new Date(expiryStr);
}

export async function sendVerificationEmail(toEmail: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: "WealthWise <onboarding@resend.dev>",
    to: toEmail,
    subject: "Your WealthWise Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #555; margin-bottom: 24px;">Use the code below to verify your email address. It expires in 15 minutes.</p>
        <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}
