// Magic Link Authentication API
import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import type { Env, Variables } from '../../types';
import { getUserByEmail, createUser, createSession } from '../../lib/db';
import { sendMagicLinkEmail } from '../../services/resend';

const magicLink = new Hono<{ Bindings: Env; Variables: Variables }>();

// Rate limiting: track requests per email (in-memory for now)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(email);
  
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 3600000 }); // 1 hour window
    return true;
  }
  
  if (limit.count >= 3) {
    return false; // Max 3 requests per hour
  }
  
  limit.count++;
  return true;
}

// Generate secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Request Magic Link
magicLink.post('/api/auth/magic-link/request', async (c) => {
  try {
    const body = await c.req.json<{ email: string; turnstileToken?: string }>();
    const { email, turnstileToken } = body;
    
    // Validate email
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }
    
    // Check rate limit
    if (!checkRateLimit(email.toLowerCase())) {
      return c.json({ 
        error: 'Too many requests. Please try again in an hour.' 
      }, 429);
    }
    
    // Verify Turnstile token (skip for localhost)
    const clientIp = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For')?.split(',')[0] || 
                     '127.0.0.1';
    const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1';
    
    if (!isLocalhost && c.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const formData = new URLSearchParams();
      formData.append('secret', c.env.TURNSTILE_SECRET_KEY);
      formData.append('response', turnstileToken);
      formData.append('remoteip', clientIp);
      
      const verifyResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        { method: 'POST', body: formData }
      );
      
      const result = await verifyResponse.json() as { success: boolean };
      if (!result.success) {
        return c.json({ error: 'Bot verification failed. Please try again.' }, 403);
      }
    }
    
    // Check if user exists, if not create one
    let user = await getUserByEmail(c.env.DB, email);
    if (!user) {
      // Create user without password (magic link only)
      const randomPassword = generateToken(); // Will never be used
      user = await createUser(c.env.DB, email, randomPassword, undefined);
      if (!user) {
        return c.json({ error: 'Failed to create account' }, 500);
      }
    }
    
    // Generate magic link token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Store token in database
    await c.env.DB.prepare(`
      INSERT INTO magic_links (user_id, email, token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      email.toLowerCase(),
      token,
      expiresAt.toISOString(),
      clientIp,
      c.req.header('User-Agent') || 'Unknown'
    ).run();
    
    // Send magic link email
    const magicLinkUrl = `https://moodmash.win/auth/magic-link/verify?token=${token}`;
    
    if (c.env.RESEND_API_KEY && c.env.FROM_EMAIL) {
      const sent = await sendMagicLinkEmail(
        c.env.RESEND_API_KEY,
        c.env.FROM_EMAIL,
        email,
        magicLinkUrl
      );
      
      if (!sent) {
        return c.json({ error: 'Failed to send magic link email' }, 500);
      }
    } else {
      console.log('[DEV] Magic link URL:', magicLinkUrl);
    }
    
    return c.json({ 
      success: true, 
      message: 'Magic link sent! Check your email.' 
    });
    
  } catch (error) {
    console.error('Magic link request error:', error);
    return c.json({ error: 'Failed to send magic link' }, 500);
  }
});

// Verify Magic Link
magicLink.get('/api/auth/magic-link/verify', async (c) => {
  try {
    const token = c.req.query('token');
    
    if (!token) {
      return c.json({ error: 'No token provided' }, 400);
    }
    
    // Find token in database
    const result = await c.env.DB.prepare(`
      SELECT * FROM magic_links 
      WHERE token = ? AND used_at IS NULL AND expires_at > datetime('now')
    `).bind(token).first<{
      id: number;
      user_id: number;
      email: string;
      token: string;
      expires_at: string;
    }>();
    
    if (!result) {
      return c.json({ error: 'Invalid or expired magic link' }, 400);
    }
    
    // Mark token as used
    await c.env.DB.prepare(`
      UPDATE magic_links SET used_at = datetime('now') WHERE id = ?
    `).bind(result.id).run();
    
    // Get user
    const user = await getUserByEmail(c.env.DB, result.email);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Create session
    const sessionToken = await createSession(c.env.DB, user.id);
    
    // Set cookie
    setCookie(c, 'session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    
    return c.json({ 
      success: true, 
      message: 'Login successful',
      redirect: '/'
    });
    
  } catch (error) {
    console.error('Magic link verify error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// Magic Link verification page (HTML)
magicLink.get('/auth/magic-link/verify', async (c) => {
  const token = c.req.query('token');
  
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Magic Link - MoodMash</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; }
    .loader { border: 3px solid #374151; border-top: 3px solid #6366f1; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body class="flex items-center justify-center p-4">
  <div class="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
    <div id="loading" class="flex flex-col items-center">
      <div class="loader mb-4"></div>
      <h2 class="text-xl font-semibold text-white mb-2" data-i18n="magic_link_verifying">Verifying Magic Link</h2>
      <p class="text-gray-400" data-i18n="magic_link_please_wait">Please wait while we verify your magic link...</p>
    </div>
    
    <div id="success" class="hidden flex-col items-center">
      <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
        <i class="fas fa-check text-3xl text-green-400"></i>
      </div>
      <h2 class="text-xl font-semibold text-white mb-2" data-i18n="magic_link_success">Login Successful!</h2>
      <p class="text-gray-400" data-i18n="magic_link_redirecting">Redirecting to your dashboard...</p>
    </div>
    
    <div id="error" class="hidden flex-col items-center">
      <div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <i class="fas fa-times text-3xl text-red-400"></i>
      </div>
      <h2 class="text-xl font-semibold text-white mb-2" data-i18n="magic_link_error">Verification Failed</h2>
      <p id="error-message" class="text-gray-400 mb-4" data-i18n="magic_link_invalid">Invalid or expired magic link</p>
      <a href="/login" class="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
        <i class="fas fa-arrow-left mr-2"></i>
        <span data-i18n="magic_link_back_to_login">Back to Login</span>
      </a>
    </div>
  </div>
  
  <script>
    async function verifyMagicLink() {
      const token = '${token || ''}';
      
      if (!token) {
        showError('No token provided');
        return;
      }
      
      try {
        const response = await fetch('/api/auth/magic-link/verify?token=' + token);
        const data = await response.json();
        
        if (data.success) {
          showSuccess();
          setTimeout(() => {
            window.location.href = data.redirect || '/';
          }, 1500);
        } else {
          showError(data.error || 'Verification failed');
        }
      } catch (error) {
        showError('Network error. Please try again.');
      }
    }
    
    function showSuccess() {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('success').classList.remove('hidden');
      document.getElementById('success').classList.add('flex');
    }
    
    function showError(message) {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('error').classList.remove('hidden');
      document.getElementById('error').classList.add('flex');
      document.getElementById('error-message').textContent = message;
    }
    
    verifyMagicLink();
  </script>
</body>
</html>
  `);
});

export default magicLink;
