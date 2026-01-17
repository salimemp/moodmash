// Resend Email Service

const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(
  apiKey: string,
  fromEmail: string,
  options: EmailOptions
): Promise<boolean> {
  if (!apiKey || !fromEmail) {
    console.error('Resend not configured');
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(
  apiKey: string,
  fromEmail: string,
  to: string,
  name: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #fff; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #16213e; border-radius: 12px; padding: 32px; }
    h1 { color: #4f46e5; margin-bottom: 16px; }
    p { color: #e0e0e0; line-height: 1.6; }
    .button { display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #333; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to MoodMash! 🎉</h1>
    <p>Hi ${name || 'there'},</p>
    <p>Thanks for joining MoodMash! We're excited to help you track and understand your moods better.</p>
    <p>Here's what you can do:</p>
    <ul>
      <li>📊 Log your daily moods and emotions</li>
      <li>📅 View your mood history on a calendar</li>
      <li>🎤 Record voice journals</li>
      <li>📈 Get personalized insights</li>
    </ul>
    <a href="#" class="button">Start Tracking</a>
    <div class="footer">
      <p>Questions? Reply to this email and we'll help you out.</p>
      <p>© MoodMash - Your Mental Wellness Companion</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail(apiKey, fromEmail, {
    to,
    subject: 'Welcome to MoodMash! 🎉',
    html,
    text: `Welcome to MoodMash, ${name || 'there'}! Start tracking your moods today.`
  });
}

export async function sendPasswordResetEmail(
  apiKey: string,
  fromEmail: string,
  to: string,
  resetUrl: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #fff; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #16213e; border-radius: 12px; padding: 32px; }
    h1 { color: #4f46e5; margin-bottom: 16px; }
    p { color: #e0e0e0; line-height: 1.6; }
    .button { display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
    .warning { color: #fbbf24; font-size: 14px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #333; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reset Your Password 🔐</h1>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <p class="warning">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    <div class="footer">
      <p>© MoodMash - Your Mental Wellness Companion</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail(apiKey, fromEmail, {
    to,
    subject: 'Reset Your MoodMash Password',
    html,
    text: `Reset your password: ${resetUrl} (expires in 1 hour)`
  });
}

export async function sendWeeklySummaryEmail(
  apiKey: string,
  fromEmail: string,
  to: string,
  name: string,
  stats: {
    totalMoods: number;
    avgIntensity: number;
    dominantEmotion: string;
    streak: number;
  }
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #fff; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #16213e; border-radius: 12px; padding: 32px; }
    h1 { color: #4f46e5; margin-bottom: 16px; }
    p { color: #e0e0e0; line-height: 1.6; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0; }
    .stat-card { background: #0f172a; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #4f46e5; }
    .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
    .button { display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #333; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Your Weekly Mood Summary 📊</h1>
    <p>Hi ${name || 'there'}, here's how your week went:</p>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.totalMoods}</div>
        <div class="stat-label">Moods Logged</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.avgIntensity.toFixed(1)}</div>
        <div class="stat-label">Avg Intensity</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.dominantEmotion}</div>
        <div class="stat-label">Top Emotion</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.streak} 🔥</div>
        <div class="stat-label">Day Streak</div>
      </div>
    </div>
    <a href="#" class="button">View Full Dashboard</a>
    <div class="footer">
      <p>Keep up the great work with your mood tracking!</p>
      <p>© MoodMash - Your Mental Wellness Companion</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail(apiKey, fromEmail, {
    to,
    subject: `Your Weekly Mood Summary - ${stats.dominantEmotion} Week 📊`,
    html,
    text: `Weekly summary: ${stats.totalMoods} moods logged, avg intensity ${stats.avgIntensity.toFixed(1)}, top emotion: ${stats.dominantEmotion}`
  });
}
