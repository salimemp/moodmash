import { createToken } from '@/lib/auth/token';
import { db } from '@/lib/db/prisma';
import nodemailer from 'nodemailer';

interface SendVerificationEmailParams {
  email: string;
  userId: string;
  baseUrl: string;
}

export async function sendVerificationEmail({
  email,
  userId,
  baseUrl,
}: SendVerificationEmailParams): Promise<void> {
  // Create a verification token
  const token = await createToken('verification', userId);

  // Save token in the database
  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Create verification URL
  const verificationUrl = `${baseUrl}/auth/verify?token=${token}`;

  // Setup email transporter (for development, using a test account)
  let transporter;
  if (process.env.NODE_ENV === 'production') {
    // Production email service (e.g., SendGrid, Amazon SES, etc.)
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
    // For development/test environments, use Ethereal
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
    subject: 'Verify your MoodMash account',
    text: `Welcome to MoodMash! Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366F1;">Welcome to MoodMash!</h2>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #6366F1; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 20px 0;">Verify Email</a>
        <p style="color: #666;">If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p style="color: #666;">This link will expire in 24 hours.</p>
      </div>
    `,
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  if (process.env.NODE_ENV !== 'production') {
    // Log preview URL for development environments
    // eslint-disable-next-line no-console
    console.log('Verification email preview:', nodemailer.getTestMessageUrl(info));
  }
}
