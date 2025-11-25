/**
 * Email Utilities using Resend API
 * https://resend.com/docs/api-reference/emails/send-email
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Send email via Resend API
 */
export async function sendEmail(
  apiKey: string,
  options: EmailOptions
): Promise<{ id: string; success: boolean }> {
  const { to, subject, html, from = 'MoodMash <noreply@moodmash.win>', replyTo, cc, bcc } = options;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo,
        cc,
        bcc
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Email] Send failed:', error);
      throw new Error(`Email API error: ${response.status} - ${error.message || 'Unknown error'}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      success: true
    };
  } catch (error) {
    console.error('[Email] Send error:', error);
    throw error;
  }
}

/**
 * Generate password reset email HTML
 */
export function generatePasswordResetEmail(resetLink: string, expiresInMinutes: number = 60): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - MoodMash</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 10px;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      color: #4b5563;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #3b82f6;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .link {
      word-break: break-all;
      color: #3b82f6;
      font-size: 14px;
      background-color: #f3f4f6;
      padding: 10px;
      border-radius: 4px;
      margin: 20px 0;
      display: block;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌈 MoodMash</div>
    </div>
    
    <h1>Reset Your Password</h1>
    
    <p>Hello!</p>
    
    <p>We received a request to reset your MoodMash password. Click the button below to create a new password:</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <div class="link">${resetLink}</div>
    
    <div class="warning">
      <strong>⏱️ This link will expire in ${expiresInMinutes} minutes.</strong>
    </div>
    
    <p><strong>Didn't request this?</strong><br>
    If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
    
    <div class="footer">
      <p>This is an automated email from MoodMash.<br>
      Please do not reply to this email.</p>
      <p>&copy; 2025 MoodMash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate magic link email HTML
 */
export function generateMagicLinkEmail(magicLink: string, expiresInMinutes: number = 15): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to MoodMash</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 10px;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      color: #4b5563;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #059669;
    }
    .link {
      word-break: break-all;
      color: #3b82f6;
      font-size: 14px;
      background-color: #f3f4f6;
      padding: 10px;
      border-radius: 4px;
      margin: 20px 0;
      display: block;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .security-tip {
      background-color: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌈 MoodMash</div>
    </div>
    
    <h1>🔐 Sign in to MoodMash</h1>
    
    <p>Hello!</p>
    
    <p>Click the button below to sign in to your MoodMash account. No password needed!</p>
    
    <div style="text-align: center;">
      <a href="${magicLink}" class="button">Sign In Now</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <div class="link">${magicLink}</div>
    
    <div class="warning">
      <strong>⏱️ This link will expire in ${expiresInMinutes} minutes.</strong>
    </div>
    
    <div class="security-tip">
      <strong>🔒 Security Tip:</strong> Make sure you're on moodmash.win before signing in. Never share this link with anyone.
    </div>
    
    <p><strong>Didn't request this?</strong><br>
    If you didn't try to sign in, you can safely ignore this email. No action is needed.</p>
    
    <div class="footer">
      <p>This is an automated email from MoodMash.<br>
      Please do not reply to this email.</p>
      <p>&copy; 2025 MoodMash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate 2FA backup codes email HTML
 */
export function generate2FABackupCodesEmail(backupCodes: string[]): string {
  const codesHtml = backupCodes.map(code => `<div class="code">${code}</div>`).join('');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your 2FA Backup Codes - MoodMash</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 10px;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      color: #4b5563;
      margin-bottom: 20px;
    }
    .codes-container {
      background-color: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .code {
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      padding: 8px;
      margin: 4px 0;
      background-color: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      text-align: center;
    }
    .warning {
      background-color: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌈 MoodMash</div>
    </div>
    
    <h1>🔐 Your 2FA Backup Codes</h1>
    
    <p>You've successfully enabled Two-Factor Authentication! Here are your backup codes:</p>
    
    <div class="codes-container">
      ${codesHtml}
    </div>
    
    <div class="warning">
      <strong>⚠️ IMPORTANT:</strong> Save these codes in a safe place! Each code can only be used once. You can use these codes to access your account if you lose access to your authenticator device.
    </div>
    
    <p><strong>How to use backup codes:</strong></p>
    <ul>
      <li>Enter a backup code instead of your 6-digit authenticator code when signing in</li>
      <li>Each code works only once and will be invalidated after use</li>
      <li>You can regenerate new codes anytime from your security settings</li>
    </ul>
    
    <div class="footer">
      <p>This is an automated email from MoodMash.<br>
      Please do not reply to this email.</p>
      <p>&copy; 2025 MoodMash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate welcome email HTML
 */
export function generateWelcomeEmail(userName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MoodMash!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    h1 {
      color: #1f2937;
      font-size: 28px;
      margin-bottom: 20px;
    }
    p {
      color: #4b5563;
      margin-bottom: 20px;
    }
    .feature {
      background-color: #f9fafb;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #3b82f6;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌈✨</div>
      <h1>Welcome to MoodMash!</h1>
    </div>
    
    <p>Hi ${userName},</p>
    
    <p>Welcome aboard! We're thrilled to have you join our community of people taking control of their emotional wellbeing.</p>
    
    <div class="feature">
      <strong>📊 Track Your Mood</strong><br>
      Log your emotions and identify patterns over time
    </div>
    
    <div class="feature">
      <strong>🧘 Wellness Activities</strong><br>
      Get personalized recommendations based on your mood
    </div>
    
    <div class="feature">
      <strong>🎯 Challenges & Achievements</strong><br>
      Stay motivated with gamified wellness goals
    </div>
    
    <div class="feature">
      <strong>🔒 Privacy First</strong><br>
      Your data is encrypted and completely private
    </div>
    
    <div style="text-align: center;">
      <a href="https://moodmash.win/" class="button">Start Tracking Your Mood</a>
    </div>
    
    <p>If you have any questions, feel free to reach out. We're here to support your journey!</p>
    
    <p>Take care,<br>
    <strong>The MoodMash Team</strong></p>
    
    <div class="footer">
      <p>You're receiving this because you signed up for MoodMash.<br>
      <a href="https://moodmash.win/settings">Manage your email preferences</a></p>
      <p>&copy; 2025 MoodMash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
