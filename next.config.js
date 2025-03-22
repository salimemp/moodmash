/** @type {import('next').NextConfig} */
import { withSentryConfig } from '@sentry/nextjs';
import withNextIntl from 'next-i18next/plugin';
import i18nConfig from './next-i18next.config.js';

// Initialize the PWA plugin with configuration
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

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
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  experimental: {
    webpackBuildWorker: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@radix-ui/react-slider',
      'jotai',
      'zustand',
      'sonner',
      'three'
    ],
    optimizeCss: true,
    forceSwcTransforms: true,
  },
  webpack: (config, { isServer, dev }) => {
    config.optimization.providedExports = true;
    config.optimization.usedExports = true;
    config.optimization.sideEffects = true;

    if (!dev) {
      config.optimization.minimize = true;
    }

    return config;
  },
  swcMinify: true,
  transpilePackages: ['@mediapipe/face_detection'],
};

// Combine multiple plugins
const withPlugins = (plugins, config) => 
  plugins.reduce((acc, plugin) => plugin(acc), config);

// Sentry configuration
const sentryWebpackPluginOptions = {
  silent: false,
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
};

const config = process.env.SENTRY_DSN
  ? withSentryConfig(
      withPlugins([withNextIntl, withPWA], nextConfig),
      sentryWebpackPluginOptions
    )
  : withPlugins([withNextIntl, withPWA], nextConfig);

export default config;
