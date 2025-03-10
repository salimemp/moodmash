import nextra from 'nextra'
import { i18n } from './next-i18next.config.js'

// Create the Nextra documentation setup with the docs theme
const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './docs/theme.config.jsx',
  staticImage: true,
  defaultShowCopyCode: true,
  readingTime: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  // Configure image domains
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  // Configure Nextra route handling
  // This ensures the docs files don't interfere with your regular Next.js routes
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
}

// Export the combined configuration
export default withNextra(nextConfig)
