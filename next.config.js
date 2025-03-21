/** @type {import('next').NextConfig} */
import { withSentryConfig } from '@sentry/nextjs';
import i18nConfig from './next-i18next.config.js';

const { i18n } = i18nConfig;

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

const config = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default config;
