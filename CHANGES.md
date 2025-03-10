# Changelog

All notable changes to the MoodMash project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project initialization with Next.js 14.2.24 and Page Router
- Tailwind CSS and shadcn/ui component integration
- Clean Architecture directory structure (entities, useCases, controllers, frameworks)
- State management with Jotai, Zustand, and React Query
- Dark/light mode theming with theme provider
- Basic UI components (Button, Card, Dialog, Slider)
- Main layout with responsive design and theme switching
- Mood card component with like, comment, and share functionality
- Mood feed component with sample mood data
- Mood creator component with color gradient and emoji selection
- Modal integration for mood creation interface
- Entity models for User and Mood
- Husky pre-commit hooks for code quality
- ESLint and Prettier configuration
- Commitlint setup with conventional commits
- Storybook configuration for component documentation

### Changed
- Updated index page to use MainLayout and MoodFeed components
- Replaced default Next.js starter page with custom MoodMash UI

### Fixed
- None

## [0.1.0] - 2024-03-09

### Added
- Initial project setup 