import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';

const legal = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /api/legal/:type - Get legal document
legal.get('/:type', async (c) => {
  const type = c.req.param('type');
  const language = c.req.query('lang') || 'en';
  
  const validTypes = ['privacy', 'terms', 'cookies', 'dpa'];
  if (!validTypes.includes(type)) {
    return c.json({ success: false, error: 'Invalid document type' }, 400);
  }
  
  try {
    // Get current version from database
    const doc = await c.env.DB.prepare(`
      SELECT * FROM legal_documents 
      WHERE type = ? AND language = ? AND is_current = 1
    `).bind(type, language).first();
    
    if (doc) {
      return c.json({ success: true, document: doc });
    }
    
    // Return default document if not in DB
    const defaultDocs: Record<string, any> = {
      privacy: getPrivacyPolicy(),
      terms: getTermsOfService(),
      cookies: getCookiePolicy(),
      dpa: getDataProcessingAgreement()
    };
    
    return c.json({
      success: true,
      document: {
        type,
        version: '1.0',
        language,
        title: defaultDocs[type].title,
        content: defaultDocs[type].content,
        effective_date: '2026-01-01'
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch document' }, 500);
  }
});

// POST /api/cookie-consent - Record cookie consent
legal.post('/cookie-consent', async (c) => {
  const userId = c.get('userId') as string;
  const { accepted, analytics, marketing, functional, sessionId } = await c.req.json();
  
  try {
    const id = crypto.randomUUID();
    const userAgent = c.req.header('user-agent') || '';
    
    await c.env.DB.prepare(`
      INSERT INTO cookie_consents (id, user_id, session_id, accepted, analytics_accepted, marketing_accepted, functional_accepted, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, userId || null, sessionId, accepted ? 1 : 0, analytics ? 1 : 0, marketing ? 1 : 0, functional ? 1 : 0, userAgent).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to save consent' }, 500);
  }
});

// GET /api/cookie-consent - Check consent status
legal.get('/cookie-consent', async (c) => {
  const userId = c.get('userId') as string;
  const sessionId = c.req.query('sessionId');
  
  try {
    let consent;
    if (userId) {
      consent = await c.env.DB.prepare(`
        SELECT * FROM cookie_consents WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
      `).bind(userId).first();
    } else if (sessionId) {
      consent = await c.env.DB.prepare(`
        SELECT * FROM cookie_consents WHERE session_id = ? ORDER BY created_at DESC LIMIT 1
      `).bind(sessionId).first();
    }
    
    return c.json({
      success: true,
      consent: consent || null
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to check consent' }, 500);
  }
});

function getPrivacyPolicy() {
  return {
    title: 'Privacy Policy',
    content: `# Privacy Policy

**Last Updated: January 1, 2026**

## Welcome to MoodMash 🌟

Your privacy matters to us. This Privacy Policy explains how MoodMash ("we", "us", "our") collects, uses, and protects your personal information.

## 1. Information We Collect

### 1.1 Information You Provide
- **Account Information:** Email, username, password (encrypted)
- **Mood Data:** Mood entries, emotions, intensity levels, notes
- **Voice Journals:** Audio recordings and transcriptions
- **Profile Information:** Avatar, display name, preferences

### 1.2 Automatically Collected Information
- **Usage Data:** Features used, session duration, interactions
- **Device Information:** Browser type, device type, operating system
- **Log Data:** IP address (anonymized), timestamps, error logs

## 2. How We Use Your Information

We use your information to:
- Provide and improve MoodMash services
- Generate personalized mood insights and patterns
- Power AI features like the Mood chatbot
- Send important notifications and updates
- Ensure security and prevent fraud
- Comply with legal obligations

## 3. Data Sharing

We **do not sell** your personal data. We may share data with:
- **Service Providers:** Cloud hosting, AI services (Gemini), email delivery
- **Legal Requirements:** When required by law or to protect rights
- **With Your Consent:** When you explicitly agree

## 4. Data Security

We implement industry-standard security measures:
- End-to-end encryption for sensitive data
- Secure HTTPS connections
- Regular security audits
- Two-factor authentication option

## 5. Your Rights (GDPR)

You have the right to:
- **Access:** Request a copy of your data
- **Rectify:** Correct inaccurate data
- **Delete:** Request deletion of your data
- **Portability:** Export your data
- **Object:** Opt-out of certain processing
- **Withdraw Consent:** At any time

## 6. Data Retention

- Active accounts: Data retained while account is active
- Deleted accounts: Data removed within 30 days
- Anonymized analytics: May be retained indefinitely

## 7. Children's Privacy

MoodMash is not intended for users under 13. We do not knowingly collect data from children.

## 8. International Transfers

Your data may be processed in countries outside your residence. We ensure appropriate safeguards are in place.

## 9. Changes to This Policy

We may update this policy. Significant changes will be notified via email or in-app notification.

## 10. Contact Us

For privacy concerns, contact us at:
- Email: privacy@moodmash.win
- Support: support@moodmash.win

---

*MoodMash - Track Your Mood, Understand Yourself* 🌈`
  };
}

function getTermsOfService() {
  return {
    title: 'Terms of Service',
    content: `# Terms of Service

**Last Updated: January 1, 2026**

## Welcome to MoodMash! 🎉

These Terms of Service ("Terms") govern your use of MoodMash. By using our service, you agree to these Terms.

## 1. Acceptance of Terms

By accessing or using MoodMash, you agree to be bound by these Terms and our Privacy Policy.

## 2. Description of Service

MoodMash is a mood tracking and mental wellness application that provides:
- Mood logging and tracking
- AI-powered insights
- Voice journaling
- Social features
- Personalized recommendations

## 3. User Accounts

### 3.1 Registration
- You must provide accurate information
- You're responsible for maintaining account security
- One account per person

### 3.2 Account Security
- Keep your password confidential
- Notify us of unauthorized access
- We're not liable for unauthorized access due to your negligence

## 4. Acceptable Use

You agree NOT to:
- Use the service for illegal purposes
- Harass, abuse, or harm others
- Share harmful or inappropriate content
- Attempt to access unauthorized areas
- Interfere with service operation
- Impersonate others

## 5. User Content

### 5.1 Ownership
You retain ownership of content you create. By posting, you grant us a license to use, store, and display your content.

### 5.2 Responsibility
You're responsible for your content. Don't post content that's illegal, harmful, or violates others' rights.

## 6. AI Features

- AI responses are for informational purposes only
- AI is not a substitute for professional mental health care
- We don't guarantee accuracy of AI-generated content

## 7. Subscription Plans

### 7.1 Free Tier
Limited features as described in our pricing

### 7.2 Paid Tiers
- Pro and Premium plans available
- Pricing subject to change with notice
- Refunds per applicable law

## 8. Intellectual Property

MoodMash and its content are protected by copyright and trademark laws. You may not copy, modify, or distribute our content without permission.

## 9. Disclaimers

- Service provided "as is"
- Not a substitute for professional medical advice
- We don't guarantee uninterrupted service
- Not responsible for third-party content

## 10. Limitation of Liability

To the maximum extent permitted by law, MoodMash shall not be liable for indirect, incidental, or consequential damages.

## 11. Changes to Terms

We may modify these Terms. Continued use after changes constitutes acceptance.

## 12. Termination

We may suspend or terminate accounts for violations. You may delete your account at any time.

## 13. Governing Law

These Terms are governed by the laws of the applicable jurisdiction.

## 14. Contact

Questions? Contact us at support@moodmash.win

---

*Thank you for being part of MoodMash!* 💜`
  };
}

function getCookiePolicy() {
  return {
    title: 'Cookie Policy',
    content: `# Cookie Policy

**Last Updated: January 1, 2026**

## What Are Cookies? 🍪

Cookies are small text files stored on your device when you visit websites. They help us remember your preferences and improve your experience.

## How We Use Cookies

### Essential Cookies
- **Purpose:** Required for basic functionality
- **Examples:** Authentication, security, session management
- **Can't be disabled:** These are necessary for the service to work

### Functional Cookies
- **Purpose:** Remember your preferences
- **Examples:** Language settings, theme preferences
- **Optional:** You can disable these

### Analytics Cookies
- **Purpose:** Understand how you use MoodMash
- **Examples:** Page views, feature usage
- **Optional:** You can opt-out

## Managing Cookies

You can control cookies through:
- **Browser Settings:** Most browsers allow you to block cookies
- **Our Cookie Banner:** Accept or decline non-essential cookies
- **Account Settings:** Manage preferences in your profile

## Third-Party Cookies

We may use services that set their own cookies:
- Analytics providers
- Security services

## Contact Us

Questions about cookies? Email us at support@moodmash.win

---

*Your privacy is our priority* 🔒`
  };
}

function getDataProcessingAgreement() {
  return {
    title: 'Data Processing Agreement',
    content: `# Data Processing Agreement

**Last Updated: January 1, 2026**

This Data Processing Agreement ("DPA") forms part of the Terms of Service between you and MoodMash.

## 1. Definitions

- **Personal Data:** Information relating to an identified person
- **Processing:** Any operation performed on personal data
- **Controller:** Entity determining purposes of processing
- **Processor:** Entity processing data on behalf of controller

## 2. Roles

- You are the Controller of your personal data
- MoodMash is the Processor

## 3. Processing Details

### 3.1 Categories of Data
- Account information
- Mood and wellness data
- Voice recordings
- Usage data

### 3.2 Purpose
- Provide MoodMash services
- Generate insights and analytics
- Improve user experience

## 4. Security Measures

We implement:
- Encryption at rest and in transit
- Access controls
- Regular security assessments
- Incident response procedures

## 5. Sub-Processors

We may engage sub-processors with similar data protection obligations.

## 6. Data Subject Rights

We assist you in responding to data subject requests.

## 7. Data Retention

Data retained per our Privacy Policy.

## 8. Audit Rights

You may audit our compliance with reasonable notice.

## 9. Contact

For DPA inquiries: legal@moodmash.win

---

*Committed to GDPR compliance* 🇪🇺`
  };
}

export default legal;
