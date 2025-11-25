/**
 * Email Verification Utility
 * Handles email verification tokens and templates
 */

/**
 * Generate email verification HTML template
 */
export function generateVerificationEmail(
  verificationLink: string,
  username: string,
  expiresInMinutes: number = 60
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - MoodMash</title>
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
    .info {
      background-color: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
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
      <h1>Verify Your Email Address</h1>
    </div>
    
    <p>Hi ${username},</p>
    
    <p>Welcome to MoodMash! To complete your registration and start tracking your mood, please verify your email address by clicking the button below:</p>
    
    <div style="text-align: center;">
      <a href="${verificationLink}" class="button">Verify Email Address</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <div class="link">${verificationLink}</div>
    
    <div class="warning">
      <strong>⏱️ This link will expire in ${expiresInMinutes} minutes.</strong>
    </div>
    
    <div class="info">
      <strong>🔒 Why verify your email?</strong><br>
      Email verification helps us ensure the security of your account and enables us to send you important notifications about your mood tracking journey.
    </div>
    
    <p><strong>Didn't create an account?</strong><br>
    If you didn't sign up for MoodMash, you can safely ignore this email. Your email address will not be used.</p>
    
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
 * Generate resend verification email HTML template
 */
export function generateResendVerificationEmail(
  verificationLink: string,
  username: string,
  expiresInMinutes: number = 60
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resend Verification Email - MoodMash</title>
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
      <div class="logo">🌈📧</div>
      <h1>Verify Your Email Address</h1>
    </div>
    
    <p>Hi ${username},</p>
    
    <p>You requested a new verification link for your MoodMash account. Click the button below to verify your email address:</p>
    
    <div style="text-align: center;">
      <a href="${verificationLink}" class="button">Verify Email Address</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <div class="link">${verificationLink}</div>
    
    <div class="warning">
      <strong>⏱️ This link will expire in ${expiresInMinutes} minutes.</strong>
    </div>
    
    <p><strong>Didn't request this?</strong><br>
    If you didn't request a new verification link, you can safely ignore this email.</p>
    
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
