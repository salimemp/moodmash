# Refactoring Recommendations

This document outlines recommendations for refactoring large files in the MoodMash codebase to improve maintainability and readability.

## Large Files to Refactor

The following files have been identified as candidates for refactoring due to their size and complexity:

### 1. SecureMessaging.tsx (414 lines)

**Current Issues:**
- Handles too many responsibilities (UI, encryption, API calls, state management)
- Complex state management with multiple inter-dependent states
- Mixes encryption logic with UI rendering

**Refactoring Plan:**
- Split into smaller components:
  - `MessageList.tsx` - Component for displaying messages
  - `MessageComposer.tsx` - Component for composing and sending messages
  - `EncryptionSetup.tsx` - Component for handling encryption setup
  - `MessageDecryptor.tsx` - Component for message decryption
  - `useSecureMessaging.ts` - Custom hook for state and API calls

### 2. EnhancedMoodCreator.tsx (250 lines)

**Current Issues:**
- Combines multiple features (text input, sentiment analysis, emoji selection, art generation)
- Complex state handling across different tabs and features
- Mixes UI with business logic for sentiment analysis and art generation

**Refactoring Plan:**
- Split into smaller components:
  - `TextInput.tsx` - Text input and sentiment analysis
  - `EmojiSelector.tsx` - Emoji selection based on sentiment
  - `GradientPreview.tsx` - Gradient display and customization
  - `ArtGenerationPanel.tsx` - Art generation options and display
  - `useSentimentAnalysis.ts` - Hook for sentiment analysis
  - `useArtGeneration.ts` - Hook for art generation

### 3. EncryptionSettings.tsx (245 lines)

**Current Issues:**
- Multi-step wizard with complex state management
- Mixes different UI states in a single component
- Encryption logic mixed with UI rendering

**Refactoring Plan:**
- Split into step-specific components:
  - `EncryptionIntro.tsx` - Introduction step
  - `PasswordCreation.tsx` - Password creation step
  - `PasswordConfirmation.tsx` - Password confirmation step
  - `EncryptionComplete.tsx` - Completion status
  - `useEncryptionSetup.ts` - Custom hook for encryption logic

### 4. rate-limit.ts (137 lines)

**Current Issues:**
- Combines configuration, middleware, and implementation
- Handles multiple rate limit types in a single file
- No separation between storage and application logic

**Refactoring Plan:**
- Split into focused modules:
  - `rate-limit-config.ts` - Configuration values
  - `rate-limit-middleware.ts` - Express/Next.js middleware
  - `rate-limit-client.ts` - Client-side utilities
  - `rate-limit-storage.ts` - Storage adapters

## General Refactoring Principles

When refactoring these and other files, follow these principles:

1. **Single Responsibility Principle**: Each component or module should have a single responsibility.

2. **Separation of Concerns**: Separate UI logic from business logic and data handling.

3. **Custom Hooks**: Extract complex state management into custom hooks.

4. **Component Composition**: Compose smaller, focused components rather than creating large monolithic ones.

5. **Progressive Refactoring**: Refactor incrementally to minimize risk and ensure continual testing.

## Implementation Strategy

1. Add TODOs to the files that need refactoring (already done)
2. Create new files for each extracted component/module
3. Gradually move functionality to the new files
4. Update imports in existing code
5. Test thoroughly after each refactoring step

## WebAuthn Module Restructuring (Already Completed)

The WebAuthn module has already been successfully restructured into smaller, focused files:

- `webauthn-config.ts` - Configuration values and utility functions
- `webauthn-registration.ts` - Registration-specific functionality
- `webauthn-authentication.ts` - Authentication-specific functionality
- `webauthn-credentials.ts` - Credential management functionality

This structure can serve as a model for other refactoring efforts. 