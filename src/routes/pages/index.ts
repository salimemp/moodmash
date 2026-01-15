/**
 * Page Routes
 * Server-side rendered HTML pages
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { renderHTML } from '../../template';

const pages = new Hono<{ Bindings: Bindings }>();

// Homepage / Dashboard
pages.get('/', (c) => {
  return c.html(renderHTML(
    'Dashboard',
    '<div id="app"></div>',
    ''
  ));
});

// Dashboard page (explicit route)
pages.get('/dashboard', (c) => {
  return c.html(renderHTML(
    'Dashboard',
    '<div id="app"></div>',
    'dashboard'
  ));
});

// Achievements page
pages.get('/achievements', (c) => {
  return c.html(renderHTML(
    'Achievements',
    '<div id="achievements-page"></div>',
    'achievements'
  ));
});

// Login page
pages.get('/login', (c) => {
  return c.html(renderHTML(
    'Login',
    '<div id="auth-container"></div>',
    'login'
  ));
});

// Register page
pages.get('/register', (c) => {
  return c.html(renderHTML(
    'Sign Up',
    '<div id="auth-container"></div>',
    'register'
  ));
});

// Email verification page
pages.get('/verify-email', (c) => {
  return c.html(renderHTML(
    'Verify Email',
    '<div id="verify-email-page"></div>',
    'verify-email'
  ));
});

// Magic link page
pages.get('/auth/magic', (c) => {
  return c.html(renderHTML(
    'Magic Link',
    '<div id="magic-link-page"></div>',
    'magic-link'
  ));
});

// Log mood page
pages.get('/log', (c) => {
  return c.html(renderHTML(
    'Log Mood',
    '<div id="log-mood-page"></div>',
    'log'
  ));
});

// Activities page
pages.get('/activities', (c) => {
  return c.html(renderHTML(
    'Activities',
    '<div id="activities-page"></div>',
    'activities'
  ));
});

// Profile page
pages.get('/profile', (c) => {
  return c.html(renderHTML(
    'Profile',
    '<div id="profile-page"></div>',
    'profile'
  ));
});

// Mood history page
pages.get('/mood', (c) => {
  return c.html(renderHTML(
    'Mood History',
    '<div id="mood-history-page"></div>',
    'mood'
  ));
});

// Health dashboard
pages.get('/health-dashboard', (c) => {
  return c.html(renderHTML(
    'Health Dashboard',
    '<div id="health-dashboard-page"></div>',
    'health-dashboard'
  ));
});

// AI Chat page
pages.get('/ai-chat', (c) => {
  return c.html(renderHTML(
    'AI Chat',
    '<div id="ai-chat-page"></div>',
    'ai-chat'
  ));
});

// AI Insights page
pages.get('/ai-insights', (c) => {
  return c.html(renderHTML(
    'AI Insights',
    '<div id="ai-insights-page"></div>',
    'ai-insights'
  ));
});

// Express mood page
pages.get('/express', (c) => {
  return c.html(renderHTML(
    'Express Mood',
    '<div id="express-page"></div>',
    'express'
  ));
});

// Insights page
pages.get('/insights', (c) => {
  return c.html(renderHTML(
    'Insights',
    '<div id="insights-page"></div>',
    'insights'
  ));
});

// Quick select page
pages.get('/quick-select', (c) => {
  return c.html(renderHTML(
    'Quick Select',
    '<div id="quick-select-page"></div>',
    'quick-select'
  ));
});

// Wellness tips page
pages.get('/wellness-tips', (c) => {
  return c.html(renderHTML(
    'Wellness Tips',
    '<div id="wellness-tips-page"></div>',
    'wellness-tips'
  ));
});

// Challenges page
pages.get('/challenges', (c) => {
  return c.html(renderHTML(
    'Challenges',
    '<div id="challenges-page"></div>',
    'challenges'
  ));
});

// Color psychology page
pages.get('/color-psychology', (c) => {
  return c.html(renderHTML(
    'Color Psychology',
    '<div id="color-psychology-page"></div>',
    'color-psychology'
  ));
});

// Social feed page
pages.get('/social-feed', (c) => {
  return c.html(renderHTML(
    'Social Feed',
    '<div id="social-feed-page"></div>',
    'social-feed'
  ));
});

// Mood groups page
pages.get('/mood-groups', (c) => {
  return c.html(renderHTML(
    'Mood Groups',
    '<div id="mood-groups-page"></div>',
    'mood-groups'
  ));
});

// Subscription page
pages.get('/subscription', (c) => {
  return c.html(renderHTML(
    'Subscription',
    '<div id="subscription-page"></div>',
    'subscription'
  ));
});

// API docs page
pages.get('/api-docs', (c) => {
  return c.html(renderHTML(
    'API Documentation',
    '<div id="api-docs-page"></div>',
    'api-docs'
  ));
});

// Privacy policy page
pages.get('/privacy-policy', (c) => {
  return c.html(renderHTML(
    'Privacy Policy',
    '<div id="privacy-policy-page"></div>',
    'privacy-policy'
  ));
});

// Admin page
pages.get('/admin', (c) => {
  return c.html(renderHTML(
    'Admin',
    '<div id="admin-page"></div>',
    'admin'
  ));
});

// About page
pages.get('/about', (c) => {
  return c.html(renderHTML(
    'About',
    '<div id="about-page"></div>',
    'about'
  ));
});

// Contact page
pages.get('/contact', (c) => {
  return c.html(renderHTML(
    'Contact',
    '<div id="contact-page"></div>',
    'contact'
  ));
});

// Voice journal page
pages.get('/voice-journal', (c) => {
  return c.html(renderHTML(
    'Voice Journal',
    '<div id="voice-journal-page"></div>',
    'voice-journal'
  ));
});

// AR cards page
pages.get('/ar-cards', (c) => {
  return c.html(renderHTML(
    'AR Cards',
    '<div id="ar-cards-page"></div>',
    'ar-cards'
  ));
});

// 3D Avatar page
pages.get('/3d-avatar', (c) => {
  return c.html(renderHTML(
    '3D Avatar',
    '<div id="3d-avatar-page"></div>',
    '3d-avatar'
  ));
});

// AR Dashboard page
pages.get('/ar-dashboard', (c) => {
  return c.html(renderHTML(
    'AR Dashboard',
    '<div id="ar-dashboard-page"></div>',
    'ar-dashboard'
  ));
});

// Social network page
pages.get('/social-network', (c) => {
  return c.html(renderHTML(
    'Social Network',
    '<div id="social-network-page"></div>',
    'social-network'
  ));
});

// Gamification page
pages.get('/gamification', (c) => {
  return c.html(renderHTML(
    'Gamification',
    '<div id="gamification-page"></div>',
    'gamification'
  ));
});

// Biometrics page
pages.get('/biometrics', (c) => {
  return c.html(renderHTML(
    'Biometrics',
    '<div id="biometrics-page"></div>',
    'biometrics'
  ));
});

// Privacy center page
pages.get('/privacy-center', (c) => {
  return c.html(renderHTML(
    'Privacy Center',
    '<div id="privacy-center-page"></div>',
    'privacy-center'
  ));
});

// Support page
pages.get('/support', (c) => {
  return c.html(renderHTML(
    'Support',
    '<div id="support-page"></div>',
    'support'
  ));
});

// HIPAA compliance page
pages.get('/hipaa-compliance', (c) => {
  return c.html(renderHTML(
    'HIPAA Compliance',
    '<div id="hipaa-compliance-page"></div>',
    'hipaa-compliance'
  ));
});

// Security monitoring page
pages.get('/security-monitoring', (c) => {
  return c.html(renderHTML(
    'Security Monitoring',
    '<div id="security-monitoring-page"></div>',
    'security-monitoring'
  ));
});

// Research center page
pages.get('/research-center', (c) => {
  return c.html(renderHTML(
    'Research Center',
    '<div id="research-center-page"></div>',
    'research-center'
  ));
});

// Privacy education page
pages.get('/privacy-education', (c) => {
  return c.html(renderHTML(
    'Privacy Education',
    '<div id="privacy-education-page"></div>',
    'privacy-education'
  ));
});

// CCPA rights page
pages.get('/ccpa-rights', (c) => {
  return c.html(renderHTML(
    'CCPA Rights',
    '<div id="ccpa-rights-page"></div>',
    'ccpa-rights'
  ));
});

// Monitoring page
pages.get('/monitoring', (c) => {
  return c.html(renderHTML(
    'Monitoring',
    '<div id="monitoring-page"></div>',
    'monitoring'
  ));
});

// Security test page
pages.get('/security-test', (c) => {
  return c.html(renderHTML(
    'Security Test',
    '<div id="security-test-page"></div>',
    'security-test'
  ));
});

export default pages;
