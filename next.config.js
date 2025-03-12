/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['src'], // Only run ESLint on the src directory
    ignoreDuringBuilds: process.env.NODE_ENV === 'production', // Only ignore in production
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production', // Only ignore in production
  },
  i18n,
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  poweredByHeader: false,
  compress: true,
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  silent: true,
  // Additional Sentry-specific options
};

module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
