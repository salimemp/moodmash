import { createToken } from '@/lib/auth/token';
import { db } from '@/lib/db/prisma';
import nodemailer from 'nodemailer';

interface SendPasswordResetEmailParams {
  email: string;
  userId: string;
  baseUrl: string;
}

export async function sendPasswordResetEmail({
  email,
  userId,
  baseUrl,
}: SendPasswordResetEmailParams): Promise<void> {
  // Create a password reset token
  const token = await createToken('passwordReset', userId);

  // Save token in the database
  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    },
  });

  // Create reset URL
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  // Setup email transporter (for development, using Ethereal)
  let transporter;
  if (process.env.NODE_ENV === 'production') {
    // Production email service
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  } else {
    // For development, use Ethereal
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Prepare email
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@moodmash.example.com',
    to: email,
    subject: 'Reset your MoodMash password',
    text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366F1;">Reset Your Password</h2>
        <p>You requested a password reset for your MoodMash account. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #6366F1; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 20px 0;">Reset Password</a>
        <p style="color: #666;">If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #666;">This link will expire in 1 hour.</p>
        <p style="color: #666; margin-top: 24px;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  if (process.env.NODE_ENV !== 'production') {
    // Log preview URL for development
    // eslint-disable-next-line no-console
    console.log('Password reset email preview:', nodemailer.getTestMessageUrl(info));
  }
}
