# MoodMash Testing Scope Document

**Version:** 1.0  
**Last Updated:** January 17, 2026  
**Document Owner:** QA Team

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Testing Strategy](#2-testing-strategy)
3. [Test Environment](#3-test-environment)
4. [Functional Testing](#4-functional-testing)
5. [Security Testing](#5-security-testing)
6. [Performance Testing](#6-performance-testing)
7. [Localization Testing](#7-localization-testing)
8. [Accessibility Testing](#8-accessibility-testing)
9. [Compatibility Testing](#9-compatibility-testing)
10. [Integration Testing](#10-integration-testing)
11. [Test Cases](#11-test-cases)
12. [Test Data](#12-test-data)
13. [Bug Reporting](#13-bug-reporting)
14. [Testing Schedule](#14-testing-schedule)
15. [Sign-off Criteria](#15-sign-off-criteria)

---

## 1. Introduction

### 1.1 Purpose of Testing

This document defines the comprehensive testing scope for the MoodMash wellness application. The purpose is to:

- Ensure all features work correctly across different environments
- Validate security measures protect user data
- Verify performance meets acceptable standards
- Confirm accessibility compliance for all users
- Test localization across all supported languages

### 1.2 Scope Overview

Testing covers the complete MoodMash application including:

- **Frontend:** Static HTML/CSS/JS served via Cloudflare Workers
- **Backend:** Hono-based API running on Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 for media files
- **AI Services:** Google Gemini integration
- **Email:** Resend email service
- **Payments:** Stripe integration

### 1.3 Testing Objectives

| Objective | Target | Priority |
|-----------|--------|----------|
| Zero critical bugs in production | 100% | P0 |
| Core functionality working | 100% | P0 |
| Security vulnerabilities | 0 high/critical | P0 |
| Accessibility compliance | WCAG 2.1 AA | P1 |
| Performance benchmarks | < 3s page load | P1 |
| Localization accuracy | 100% | P1 |
| Cross-browser compatibility | 95%+ users | P2 |

---

## 2. Testing Strategy

### 2.1 Testing Types

| Type | Description | Tools |
|------|-------------|-------|
| Unit Testing | Individual function/component testing | Vitest |
| Integration Testing | API and service integration | Vitest + Miniflare |
| E2E Testing | Full user flow testing | Playwright |
| Security Testing | Vulnerability assessment | OWASP ZAP, manual review |
| Performance Testing | Load and stress testing | Lighthouse, k6 |
| Accessibility Testing | WCAG compliance | axe-core, screen readers |
| Localization Testing | Translation verification | Manual + automated |

### 2.2 Testing Levels

```
┌─────────────────────────────────────────┐
│           E2E Testing (10%)             │
├─────────────────────────────────────────┤
│       Integration Testing (30%)          │
├─────────────────────────────────────────┤
│         Unit Testing (60%)               │
└─────────────────────────────────────────┘
```

### 2.3 Testing Approach

1. **Shift-Left Testing:** Test early in development cycle
2. **Continuous Testing:** Automated tests in CI/CD pipeline
3. **Risk-Based Testing:** Prioritize high-risk features
4. **Regression Testing:** Automated suite for each release
5. **Exploratory Testing:** Manual testing for edge cases

---

## 3. Test Environment

### 3.1 Development Environment

| Component | Configuration |
|-----------|--------------|
| Runtime | Node.js 20+ |
| Database | Local D1 (wrangler) |
| Workers | Miniflare local emulation |
| URL | `http://localhost:8787` |
| Debug | Full logging enabled |

### 3.2 Staging Environment

| Component | Configuration |
|-----------|--------------|
| Platform | Cloudflare Workers |
| Database | D1 staging database |
| URL | `https://staging.moodmash.com` |
| Data | Anonymized production data |

### 3.3 Production Environment

| Component | Configuration |
|-----------|--------------|
| Platform | Cloudflare Workers (global) |
| Database | D1 production database |
| URL | `https://moodmash.com` |
| Monitoring | Cloudflare Analytics |

### 3.4 Required Tools

| Category | Tool | Purpose |
|----------|------|---------|
| Test Runner | Vitest | Unit/Integration tests |
| E2E | Playwright | Browser automation |
| API Testing | Hoppscotch/Postman | API verification |
| Performance | Lighthouse | Core Web Vitals |
| Security | OWASP ZAP | Vulnerability scanning |
| Accessibility | axe DevTools | WCAG compliance |
| Load Testing | k6 | Performance under load |

---

## 4. Functional Testing

### 4.1 Authentication

#### 4.1.1 Login

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-AUTH-001 | Enter valid email/password | Redirect to dashboard | P0 |
| TC-AUTH-002 | Enter invalid email | Show validation error | P0 |
| TC-AUTH-003 | Enter wrong password | Show "Invalid credentials" | P0 |
| TC-AUTH-004 | Empty form submission | Show required field errors | P1 |
| TC-AUTH-005 | SQL injection attempt | Request blocked | P0 |
| TC-AUTH-006 | Rate limit exceeded | Show "Too many attempts" | P0 |
| TC-AUTH-007 | Remember me functionality | Session persists | P2 |
| TC-AUTH-008 | Turnstile bot protection | Challenge appears | P0 |

#### 4.1.2 Registration

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-REG-001 | Valid registration | Account created, email sent | P0 |
| TC-REG-002 | Duplicate email | Show "Email exists" error | P0 |
| TC-REG-003 | Weak password | Show strength indicator | P1 |
| TC-REG-004 | Password mismatch | Show mismatch error | P1 |
| TC-REG-005 | Invalid email format | Show validation error | P0 |
| TC-REG-006 | Terms not accepted | Block registration | P1 |

#### 4.1.3 Two-Factor Authentication (2FA)

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-2FA-001 | Enable TOTP 2FA | QR code displayed | P1 |
| TC-2FA-002 | Valid TOTP code | Login successful | P0 |
| TC-2FA-003 | Invalid TOTP code | Show error, retry | P0 |
| TC-2FA-004 | Backup codes | Generate and store | P1 |
| TC-2FA-005 | Disable 2FA | Require password confirmation | P1 |

#### 4.1.4 OAuth

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-OAUTH-001 | Google sign-in | Redirect, create account | P0 |
| TC-OAUTH-002 | GitHub sign-in | Redirect, create account | P0 |
| TC-OAUTH-003 | Link OAuth to existing | Account linked | P1 |
| TC-OAUTH-004 | Unlink OAuth provider | Provider removed | P2 |
| TC-OAUTH-005 | OAuth token refresh | Session maintained | P1 |

### 4.2 Mood Tracking

#### 4.2.1 Log Mood

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-MOOD-001 | Select emotion | Emotion highlighted | P0 |
| TC-MOOD-002 | Set intensity (1-10) | Slider updates | P0 |
| TC-MOOD-003 | Add notes | Notes saved | P1 |
| TC-MOOD-004 | Add activities | Activities tagged | P1 |
| TC-MOOD-005 | Submit mood | Success message, redirect | P0 |
| TC-MOOD-006 | Edit recent mood | Changes saved | P1 |
| TC-MOOD-007 | Delete mood entry | Entry removed | P1 |

#### 4.2.2 View Moods

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-VIEW-001 | View mood history | List displayed | P0 |
| TC-VIEW-002 | Filter by date range | Filtered results | P1 |
| TC-VIEW-003 | Filter by emotion | Filtered results | P1 |
| TC-VIEW-004 | Sort by date | Correct order | P1 |
| TC-VIEW-005 | Pagination | Next/prev pages work | P1 |

#### 4.2.3 Calendar View

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-CAL-001 | View month calendar | Mood markers visible | P0 |
| TC-CAL-002 | Navigate months | Calendar updates | P1 |
| TC-CAL-003 | Click day | Show day's moods | P1 |
| TC-CAL-004 | Color coding | Emotions color-coded | P1 |

#### 4.2.4 Insights

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-INS-001 | View weekly trends | Chart displayed | P1 |
| TC-INS-002 | View emotion distribution | Pie chart shown | P1 |
| TC-INS-003 | AI-generated insights | Insights displayed | P1 |
| TC-INS-004 | Time-of-day patterns | Correlation shown | P2 |

### 4.3 Voice Journaling

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-VOICE-001 | Grant microphone permission | Permission dialog | P0 |
| TC-VOICE-002 | Record voice entry | Audio captured | P0 |
| TC-VOICE-003 | Playback recording | Audio plays | P0 |
| TC-VOICE-004 | Delete recording | Entry removed | P1 |
| TC-VOICE-005 | Speech-to-text | Transcription displayed | P1 |
| TC-VOICE-006 | AI emotion analysis | Emotions detected | P1 |
| TC-VOICE-007 | Save to R2 storage | Audio persisted | P0 |

### 4.4 AI Chatbot

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-CHAT-001 | Send message | Response received | P0 |
| TC-CHAT-002 | Context awareness | Bot remembers context | P1 |
| TC-CHAT-003 | Mood-based responses | Empathetic replies | P1 |
| TC-CHAT-004 | Rate limiting | Limit enforced | P1 |
| TC-CHAT-005 | Error handling | Graceful failure | P1 |

### 4.5 Social Features

#### 4.5.1 Friends

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-FRIEND-001 | Send friend request | Request sent | P1 |
| TC-FRIEND-002 | Accept request | Friendship created | P1 |
| TC-FRIEND-003 | Decline request | Request removed | P1 |
| TC-FRIEND-004 | Block user | User blocked | P1 |
| TC-FRIEND-005 | View friends list | List displayed | P1 |

#### 4.5.2 Groups

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-GROUP-001 | Create group | Group created | P1 |
| TC-GROUP-002 | Join group | Membership added | P1 |
| TC-GROUP-003 | Leave group | Membership removed | P1 |
| TC-GROUP-004 | Group chat | Messages visible | P2 |
| TC-GROUP-005 | Manage members | Admin controls work | P2 |

#### 4.5.3 Sharing

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-SHARE-001 | Share mood with friends | Mood visible to friends | P2 |
| TC-SHARE-002 | Privacy controls | Sharing restricted | P1 |
| TC-SHARE-003 | Activity feed | Updates displayed | P2 |

### 4.6 Gamification

#### 4.6.1 Achievements

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-ACHIEVE-001 | Unlock first mood | Achievement unlocked | P2 |
| TC-ACHIEVE-002 | 7-day streak | Badge awarded | P2 |
| TC-ACHIEVE-003 | View achievements | Gallery displayed | P2 |
| TC-ACHIEVE-004 | Share achievement | Social share works | P3 |

#### 4.6.2 Streaks

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-STREAK-001 | Daily check-in | Streak incremented | P2 |
| TC-STREAK-002 | Missed day | Streak reset | P2 |
| TC-STREAK-003 | Streak freeze | Streak preserved | P3 |

#### 4.6.3 Leaderboards

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-LEADER-001 | View weekly board | Rankings shown | P3 |
| TC-LEADER-002 | View friends board | Friend rankings | P3 |
| TC-LEADER-003 | Opt-out of rankings | User hidden | P3 |

### 4.7 Wellness Features

#### 4.7.1 Meditation

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-MED-001 | Browse sessions | Sessions listed | P2 |
| TC-MED-002 | Start session | Timer/audio starts | P2 |
| TC-MED-003 | Complete session | Progress tracked | P2 |
| TC-MED-004 | Guided meditation | Audio plays | P2 |

#### 4.7.2 Yoga

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-YOGA-001 | Browse routines | Routines listed | P2 |
| TC-YOGA-002 | Start routine | Video/timer starts | P2 |
| TC-YOGA-003 | Track progress | Progress saved | P2 |

#### 4.7.3 Music Therapy

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-MUSIC-001 | Mood-based playlist | Recommendations shown | P2 |
| TC-MUSIC-002 | Play track | Audio plays | P2 |
| TC-MUSIC-003 | Save favorites | Favorites stored | P3 |

### 4.8 Subscription & Billing

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-SUB-001 | View plans | Plans displayed | P1 |
| TC-SUB-002 | Subscribe (Stripe) | Subscription created | P0 |
| TC-SUB-003 | Payment success | Access granted | P0 |
| TC-SUB-004 | Payment failure | Error shown, retry | P0 |
| TC-SUB-005 | Cancel subscription | Subscription ended | P1 |
| TC-SUB-006 | Upgrade plan | Plan changed | P1 |
| TC-SUB-007 | View invoices | Invoice history | P2 |
| TC-SUB-008 | Refund request | Process initiated | P2 |

### 4.9 Compliance Features

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-COMP-001 | View privacy policy | Policy displayed | P1 |
| TC-COMP-002 | Export user data (GDPR) | JSON export downloaded | P0 |
| TC-COMP-003 | Delete account | All data removed | P0 |
| TC-COMP-004 | Cookie consent | Banner shown | P1 |
| TC-COMP-005 | Consent management | Preferences saved | P1 |
| TC-COMP-006 | Data retention | Old data purged | P1 |

### 4.10 Settings & Preferences

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| TC-SET-001 | Change language | UI language updated | P1 |
| TC-SET-002 | Toggle dark mode | Theme changed | P1 |
| TC-SET-003 | Update profile | Profile saved | P1 |
| TC-SET-004 | Change password | Password updated | P0 |
| TC-SET-005 | Notification preferences | Settings saved | P2 |
| TC-SET-006 | Timezone settings | Times adjusted | P2 |

---

## 5. Security Testing

### 5.1 Bot Protection (Turnstile)

| Test Case | Description | Expected Result | Priority |
|-----------|-------------|-----------------|----------|
| TC-SEC-001 | Turnstile widget renders | Widget visible on forms | P0 |
| TC-SEC-002 | Valid token accepted | Request proceeds | P0 |
| TC-SEC-003 | Invalid token rejected | 403 error returned | P0 |
| TC-SEC-004 | Expired token rejected | Request blocked | P0 |
| TC-SEC-005 | Localhost bypass | Development works | P1 |

### 5.2 Authentication Security

| Test Case | Description | Expected Result | Priority |
|-----------|-------------|-----------------|----------|
| TC-SEC-010 | Password hashing | bcrypt with 10 rounds | P0 |
| TC-SEC-011 | Session tokens | 256-bit secure random | P0 |
| TC-SEC-012 | Session expiration | 7-day expiry enforced | P0 |
| TC-SEC-013 | Secure cookie flags | HttpOnly, Secure, SameSite | P0 |
| TC-SEC-014 | Logout invalidation | Session destroyed | P0 |

### 5.3 Authorization Checks

| Test Case | Description | Expected Result | Priority |
|-----------|-------------|-----------------|----------|
| TC-SEC-020 | Access own data only | Other users' data blocked | P0 |
| TC-SEC-021 | Admin route protection | Non-admins blocked | P0 |
| TC-SEC-022 | API key validation | Invalid keys rejected | P0 |
| TC-SEC-023 | IDOR prevention | Direct object access blocked | P0 |

### 5.4 Data Encryption

| Test Case | Description | Expected Result | Priority |
|-----------|-------------|-----------------|----------|
| TC-SEC-030 | HTTPS enforcement | HTTP redirects to HTTPS | P0 |
| TC-SEC-031 | TLS 1.3 support | Modern TLS used | P0 |
| TC-SEC-032 | Data at rest | D1 encryption enabled | P1 |
| TC-SEC-033 | Sensitive data masking | PII masked in logs | P0 |

### 5.5 SQL Injection Prevention

| Test Case | Description | Expected Result | Priority |
|-----------|-------------|-----------------|----------|
| TC-SEC-040 | Parameterized queries | All queries parameterized | P0 |
| TC-SEC-041 | Input sanitization | Special chars escaped | P0 |
| TC-SEC-042 | SQLi payloads | `' OR 1=1--` blocked | P0 |
| TC-SEC-043 | Error messages | No SQL errors exposed | P0 |

### 5.6 XSS Prevention

| Test Case | Description | Expected Result | Priority |
|-----------|-------------|-----------------|----------|
| TC-SEC-050 | Output encoding | HTML entities encoded | P0 |
| TC-SEC-051 | CSP headers | Content-Security-Policy set | P0 |
| TC-SEC-052 | Script injection | `<script>` tags blocked | P0 |
| TC-SEC-053 | Event handlers | `onclick=` blocked | P0 |

### 5.7 CSRF Protection

| Test Case | Description | Expected Result | Priority |
|-----------|-------------|-----------------|----------|
| TC-SEC-060 | CSRF tokens | Tokens on state-changing forms | P0 |
| TC-SEC-061 | Token validation | Invalid tokens rejected | P0 |
| TC-SEC-062 | SameSite cookies | SameSite=Strict set | P0 |
| TC-SEC-063 | Referer validation | Cross-origin blocked | P1 |

### 5.8 Rate Limiting

| Test Case | Description | Expected Result | Priority |
|-----------|-------------|-----------------|----------|
| TC-SEC-070 | Login rate limit | 5 attempts/15 min | P0 |
| TC-SEC-071 | API rate limit | 100 requests/min | P0 |
| TC-SEC-072 | Registration limit | 3 accounts/IP/hour | P0 |
| TC-SEC-073 | Rate limit response | 429 with Retry-After | P0 |

### 5.9 Session Management

| Test Case | Description | Expected Result | Priority |
|-----------|-------------|-----------------|----------|
| TC-SEC-080 | Concurrent sessions | Max 5 active sessions | P1 |
| TC-SEC-081 | Session hijacking | IP/UA binding | P1 |
| TC-SEC-082 | Session fixation | New token on login | P0 |
| TC-SEC-083 | Idle timeout | 30 min inactivity logout | P2 |

---

## 6. Performance Testing

### 6.1 Page Load Times

| Page | Target | Max Acceptable | Priority |
|------|--------|----------------|----------|
| Landing page | < 1.5s | < 3s | P0 |
| Login page | < 1s | < 2s | P0 |
| Dashboard | < 2s | < 3s | P0 |
| Mood log | < 1.5s | < 2.5s | P0 |
| Calendar | < 2s | < 3s | P1 |
| Settings | < 1.5s | < 2.5s | P1 |

### 6.2 API Response Times

| Endpoint | Target | Max Acceptable | Priority |
|----------|--------|----------------|----------|
| POST /api/auth/login | < 300ms | < 500ms | P0 |
| GET /api/moods | < 200ms | < 400ms | P0 |
| POST /api/moods | < 200ms | < 400ms | P0 |
| GET /api/insights | < 500ms | < 1s | P1 |
| POST /api/voice-journals | < 1s | < 2s | P1 |

### 6.3 Database Performance

| Query Type | Target | Max Acceptable |
|------------|--------|----------------|
| Simple SELECT | < 10ms | < 50ms |
| JOIN queries | < 50ms | < 200ms |
| Aggregations | < 100ms | < 500ms |
| Write operations | < 20ms | < 100ms |

### 6.4 Bundle Size Optimization

| Asset | Current | Target | Status |
|-------|---------|--------|--------|
| Server bundle | 60.84KB | < 100KB | ✅ Pass |
| Client JS (critical) | 48KB | < 50KB | ✅ Pass |
| CSS | 6KB | < 10KB | ✅ Pass |
| Total initial load | ~54KB | < 100KB | ✅ Pass |

### 6.5 Core Web Vitals

| Metric | Target | Max Acceptable |
|--------|--------|----------------|
| LCP (Largest Contentful Paint) | < 2.5s | < 4s |
| FID (First Input Delay) | < 100ms | < 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.25 |
| TTFB (Time to First Byte) | < 200ms | < 600ms |
| INP (Interaction to Next Paint) | < 200ms | < 500ms |

---

## 7. Localization Testing

### 7.1 Supported Languages

| Language | Code | RTL | Priority |
|----------|------|-----|----------|
| English | en | No | P0 |
| Spanish | es | No | P1 |
| French | fr | No | P1 |
| German | de | No | P1 |
| Arabic | ar | Yes | P1 |
| Japanese | ja | No | P1 |
| Chinese (Simplified) | zh | No | P1 |
| Korean | ko | No | P1 |

### 7.2 RTL Support (Arabic)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-L10N-001 | Page direction | `dir="rtl"` applied |
| TC-L10N-002 | Text alignment | Right-aligned text |
| TC-L10N-003 | Navigation | RTL navigation order |
| TC-L10N-004 | Form layout | RTL form fields |
| TC-L10N-005 | Icons | Mirrored where needed |

### 7.3 CJK Rendering

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-L10N-010 | Japanese characters | All kanji render |
| TC-L10N-011 | Chinese characters | All hanzi render |
| TC-L10N-012 | Korean characters | All hangul render |
| TC-L10N-013 | Line breaking | Proper word wrap |
| TC-L10N-014 | Font fallback | CJK fonts load |

### 7.4 Date/Time Formats

| Language | Date Format | Time Format |
|----------|-------------|-------------|
| en | MM/DD/YYYY | 12-hour |
| es | DD/MM/YYYY | 24-hour |
| fr | DD/MM/YYYY | 24-hour |
| de | DD.MM.YYYY | 24-hour |
| ar | DD/MM/YYYY | 12-hour |
| ja | YYYY/MM/DD | 24-hour |
| zh | YYYY年MM月DD日 | 24-hour |
| ko | YYYY.MM.DD | 24-hour |

### 7.5 Number Formats

| Language | Decimal | Thousands | Example |
|----------|---------|-----------|---------|
| en | . | , | 1,234.56 |
| es | , | . | 1.234,56 |
| fr | , | (space) | 1 234,56 |
| de | , | . | 1.234,56 |
| ar | ٫ | ٬ | ١٬٢٣٤٫٥٦ |
| ja | . | , | 1,234.56 |
| zh | . | , | 1,234.56 |
| ko | . | , | 1,234.56 |

### 7.6 Currency Formats

| Currency | Symbol | Format |
|----------|--------|--------|
| USD | $ | $1,234.56 |
| EUR | € | €1.234,56 |
| GBP | £ | £1,234.56 |
| JPY | ¥ | ¥1,234 |
| CNY | ¥ | ¥1,234.56 |
| KRW | ₩ | ₩1,234 |
| SAR | ر.س | ١٬٢٣٤٫٥٦ ر.س |
| INR | ₹ | ₹1,234.56 |

---

## 8. Accessibility Testing

### 8.1 WCAG 2.1 AA Compliance

| Principle | Guideline | Test Focus |
|-----------|-----------|------------|
| Perceivable | 1.1 Text Alternatives | Alt text for images |
| Perceivable | 1.3 Adaptable | Semantic HTML structure |
| Perceivable | 1.4 Distinguishable | Color contrast |
| Operable | 2.1 Keyboard Accessible | Full keyboard navigation |
| Operable | 2.4 Navigable | Skip links, focus order |
| Understandable | 3.1 Readable | Language declaration |
| Understandable | 3.2 Predictable | Consistent navigation |
| Robust | 4.1 Compatible | Valid HTML, ARIA |

### 8.2 Screen Reader Compatibility

| Screen Reader | Platform | Status |
|---------------|----------|--------|
| NVDA | Windows | Required |
| JAWS | Windows | Required |
| VoiceOver | macOS/iOS | Required |
| TalkBack | Android | Required |

**Test Cases:**

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-A11Y-001 | Page title announced | Correct title read |
| TC-A11Y-002 | Headings navigation | H1-H6 structure correct |
| TC-A11Y-003 | Form labels | All fields labeled |
| TC-A11Y-004 | Error announcements | Errors read aloud |
| TC-A11Y-005 | Live regions | Dynamic content announced |

### 8.3 Keyboard Navigation

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-A11Y-010 | Tab navigation | Logical tab order |
| TC-A11Y-011 | Skip to content | Skip link works |
| TC-A11Y-012 | Modal focus trap | Focus stays in modal |
| TC-A11Y-013 | Dropdown menus | Arrow key navigation |
| TC-A11Y-014 | Form submission | Enter submits form |
| TC-A11Y-015 | Escape closes | Esc closes modals |

### 8.4 Color Contrast

| Element | Minimum Ratio | Target |
|---------|---------------|--------|
| Normal text | 4.5:1 | 7:1 |
| Large text (18px+) | 3:1 | 4.5:1 |
| UI components | 3:1 | 4.5:1 |
| Focus indicators | 3:1 | 4.5:1 |

### 8.5 Focus Indicators

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-A11Y-020 | Visible focus | 2px+ outline visible |
| TC-A11Y-021 | Focus contrast | 3:1 against background |
| TC-A11Y-022 | Custom focus | Styled but visible |
| TC-A11Y-023 | Focus not hidden | No `outline: none` |

---

## 9. Compatibility Testing

### 9.1 Browser Compatibility

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |
| Chrome Android | 90+ | Full |
| Safari iOS | 14+ | Full |
| Samsung Internet | 14+ | Partial |

### 9.2 Mobile Devices

| Device Category | Test Devices |
|-----------------|--------------|
| iOS | iPhone 12, iPhone 14, iPad |
| Android | Pixel 6, Samsung S21, OnePlus |
| Tablets | iPad Pro, Galaxy Tab |

### 9.3 Screen Sizes

| Breakpoint | Width | Test Focus |
|------------|-------|------------|
| Mobile S | 320px | Min width support |
| Mobile M | 375px | iPhone SE |
| Mobile L | 425px | Large phones |
| Tablet | 768px | iPad portrait |
| Laptop | 1024px | Small laptops |
| Desktop | 1440px | Standard desktop |
| 4K | 2560px | Large monitors |

### 9.4 Operating Systems

| OS | Versions |
|----|----------|
| Windows | 10, 11 |
| macOS | 12+ (Monterey+) |
| iOS | 15+ |
| Android | 11+ |
| Linux | Ubuntu 22.04+ |

---

## 10. Integration Testing

### 10.1 OAuth Providers

| Provider | Test Cases |
|----------|------------|
| Google | Login, account link, token refresh |
| GitHub | Login, account link, token refresh |

**Test Scenarios:**

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-INT-001 | Google OAuth flow | User authenticated |
| TC-INT-002 | GitHub OAuth flow | User authenticated |
| TC-INT-003 | OAuth error handling | Graceful error shown |
| TC-INT-004 | Token expiration | Auto-refresh works |

### 10.2 Email Service (Resend)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-INT-010 | Welcome email | Email delivered |
| TC-INT-011 | Password reset | Email with link sent |
| TC-INT-012 | Weekly summary | Summary email sent |
| TC-INT-013 | Email bounces | Bounce handled |
| TC-INT-014 | Unsubscribe | User unsubscribed |

### 10.3 AI Service (Gemini)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-INT-020 | Mood analysis | Emotions detected |
| TC-INT-021 | Voice transcription | Text generated |
| TC-INT-022 | Insight generation | Insights returned |
| TC-INT-023 | API rate limit | Backoff applied |
| TC-INT-024 | API error | Graceful fallback |

### 10.4 Payment Processing (Stripe)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-INT-030 | Checkout session | Stripe redirect |
| TC-INT-031 | Successful payment | Webhook received |
| TC-INT-032 | Failed payment | Error handled |
| TC-INT-033 | Subscription creation | Access granted |
| TC-INT-034 | Subscription cancel | Access revoked |
| TC-INT-035 | Webhook verification | Signature validated |

---

## 11. Test Cases

### 11.1 Test Case Matrix

| Module | Total Cases | P0 | P1 | P2 | P3 |
|--------|-------------|----|----|----|----|
| Authentication | 32 | 15 | 12 | 4 | 1 |
| Mood Tracking | 24 | 8 | 12 | 4 | 0 |
| Voice Journal | 12 | 4 | 6 | 2 | 0 |
| AI Chatbot | 8 | 2 | 4 | 2 | 0 |
| Social Features | 20 | 2 | 10 | 6 | 2 |
| Gamification | 16 | 0 | 4 | 8 | 4 |
| Wellness | 18 | 0 | 6 | 10 | 2 |
| Subscription | 12 | 4 | 4 | 4 | 0 |
| Compliance | 10 | 4 | 4 | 2 | 0 |
| Settings | 12 | 2 | 6 | 4 | 0 |
| Security | 40 | 30 | 8 | 2 | 0 |
| Performance | 25 | 10 | 10 | 5 | 0 |
| Localization | 30 | 8 | 16 | 6 | 0 |
| Accessibility | 25 | 10 | 10 | 5 | 0 |
| **TOTAL** | **284** | **99** | **112** | **64** | **9** |

### 11.2 Priority Levels

| Priority | Definition | Response Time |
|----------|------------|---------------|
| P0 | Critical - Blocks release | Fix immediately |
| P1 | High - Major feature impact | Fix before release |
| P2 | Medium - Minor feature impact | Fix in next release |
| P3 | Low - Cosmetic/enhancement | Backlog |

### 11.3 Expected Results Documentation

All test cases follow the format:

```
Test Case ID: TC-XXX-NNN
Title: Brief description
Module: Feature area
Priority: P0/P1/P2/P3
Preconditions: Required state
Steps:
  1. Action 1
  2. Action 2
  3. Action 3
Expected Result: What should happen
Actual Result: [Filled during execution]
Status: Pass/Fail/Blocked
Notes: Additional observations
```

---

## 12. Test Data

### 12.1 Test Users

| User Type | Email | Password | Role |
|-----------|-------|----------|------|
| Admin | admin@test.moodmash.com | TestAdmin123! | admin |
| Premium User | premium@test.moodmash.com | TestPremium123! | premium |
| Free User | free@test.moodmash.com | TestFree123! | free |
| New User | new@test.moodmash.com | TestNew123! | free |
| 2FA User | 2fa@test.moodmash.com | Test2FA123! | free |

### 12.2 Test Content

**Mood Entries:**

| Emotion | Intensity | Notes |
|---------|-----------|-------|
| happy | 8 | Great day at work |
| sad | 3 | Missing family |
| anxious | 6 | Upcoming presentation |
| calm | 9 | After meditation |
| angry | 4 | Traffic frustration |

**Voice Journals:**

| Duration | Emotion Detected | Transcription Length |
|----------|-----------------|---------------------|
| 30s | happy | ~50 words |
| 60s | neutral | ~100 words |
| 120s | sad | ~200 words |

### 12.3 Test Scenarios

**Scenario 1: New User Onboarding**
1. Register new account
2. Verify email
3. Complete profile setup
4. Log first mood
5. View dashboard

**Scenario 2: Daily User Flow**
1. Login
2. Log morning mood
3. View insights
4. Start meditation
5. Log evening mood
6. Check streak

**Scenario 3: Premium Upgrade**
1. View pricing
2. Select premium plan
3. Complete Stripe checkout
4. Verify premium access
5. Access premium features

---

## 13. Bug Reporting

### 13.1 Bug Report Template

```markdown
## Bug Report

**Bug ID:** BUG-XXXX
**Title:** Brief description
**Reporter:** Name
**Date:** YYYY-MM-DD

### Environment
- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop

### Description
Clear description of the issue.

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
What should happen.

### Actual Behavior
What actually happened.

### Screenshots/Videos
[Attach evidence]

### Console Logs
```
Error messages
```

### Severity
[Critical/High/Medium/Low]

### Priority
[P0/P1/P2/P3]
```

### 13.2 Severity Levels

| Severity | Definition | Example |
|----------|------------|---------|
| Critical | System down, data loss | Database corruption |
| High | Major feature broken | Cannot login |
| Medium | Feature partially broken | Filter not working |
| Low | Minor issue, workaround exists | Typo in UI |

### 13.3 Bug Tracking Process

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌────────┐    ┌────────┐
│   New   │ → │ Triaged  │ → │ In Dev  │ → │ In QA  │ → │ Closed │
└─────────┘    └──────────┘    └─────────┘    └────────┘    └────────┘
                    ↓                              ↓
               ┌─────────┐                   ┌──────────┐
               │ Rejected│                   │ Reopened │
               └─────────┘                   └──────────┘
```

---

## 14. Testing Schedule

### 14.1 Testing Phases

| Phase | Duration | Focus |
|-------|----------|-------|
| Unit Testing | Ongoing | During development |
| Integration Testing | 1 week | After feature complete |
| System Testing | 2 weeks | Full application |
| UAT | 1 week | User acceptance |
| Regression | 3 days | Pre-release |

### 14.2 Timeline

```
Week 1-2: Development + Unit Tests
Week 3: Integration Testing
Week 4: System Testing (Functional)
Week 5: System Testing (Non-Functional)
Week 6: UAT + Bug Fixes
Week 7: Regression + Sign-off
Week 8: Production Release
```

### 14.3 Milestones

| Milestone | Criteria | Target Date |
|-----------|----------|-------------|
| Alpha | Core features working | Week 2 |
| Beta | All features complete | Week 4 |
| RC1 | Zero P0/P1 bugs | Week 6 |
| GA | All sign-off criteria met | Week 8 |

---

## 15. Sign-off Criteria

### 15.1 Acceptance Criteria

| Criterion | Threshold | Mandatory |
|-----------|-----------|-----------|
| P0 bugs | 0 | Yes |
| P1 bugs | 0 | Yes |
| P2 bugs | < 5 | Yes |
| Test coverage | > 80% | Yes |
| All P0 tests pass | 100% | Yes |
| All P1 tests pass | > 95% | Yes |
| Performance benchmarks | Met | Yes |
| Security scan | No high/critical | Yes |
| Accessibility audit | WCAG AA | Yes |

### 15.2 Quality Gates

| Gate | Entry Criteria | Exit Criteria |
|------|----------------|---------------|
| Development | Requirements approved | Unit tests pass |
| QA | Dev complete | System tests pass |
| UAT | QA approved | User acceptance |
| Production | UAT approved | Monitoring active |

### 15.3 Release Criteria

**Must Have:**
- [ ] All P0/P1 bugs fixed and verified
- [ ] 100% P0 test cases passed
- [ ] 95%+ P1 test cases passed
- [ ] Security scan completed with no critical issues
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] All integrations verified
- [ ] Rollback plan documented

**Should Have:**
- [ ] 90%+ P2 test cases passed
- [ ] Documentation updated
- [ ] Monitoring dashboards configured
- [ ] On-call rotation scheduled

**Nice to Have:**
- [ ] All P2 bugs fixed
- [ ] P3 bugs reviewed and prioritized
- [ ] Performance optimizations completed

---

## Appendix A: Testing Tools Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
export default {
  test: {
    environment: 'miniflare',
    coverage: {
      reporter: ['text', 'html'],
      threshold: {
        lines: 80,
        branches: 80,
        functions: 80
      }
    }
  }
}
```

### Playwright Configuration

```typescript
// playwright.config.ts
export default {
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:8787',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } }
  ]
}
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| E2E | End-to-End testing |
| UAT | User Acceptance Testing |
| WCAG | Web Content Accessibility Guidelines |
| P0 | Highest priority (critical) |
| RC | Release Candidate |
| GA | General Availability |
| IDOR | Insecure Direct Object Reference |
| XSS | Cross-Site Scripting |
| CSRF | Cross-Site Request Forgery |
| LCP | Largest Contentful Paint |
| FID | First Input Delay |
| CLS | Cumulative Layout Shift |

---

**Document Approval:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | _____________ | _____________ | _____________ |
| Dev Lead | _____________ | _____________ | _____________ |
| Product Owner | _____________ | _____________ | _____________ |
| Project Manager | _____________ | _____________ | _____________ |

---

*Last Updated: January 17, 2026*
*Version: 1.0*
