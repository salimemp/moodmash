# Commit Convention

## Overview

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This leads to more readable messages that are easy to follow when looking through the project history and helps with automatic versioning and changelog generation.

## Commit Message Format

Each commit message consists of a **header**, an optional **body**, and an optional **footer**. The header has a special format that includes a **type**, an optional **scope**, and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Header

The header is mandatory and must conform to the following format:

- **type**: Describes the kind of change that this commit is providing. Allowed types are:

  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing tests or correcting existing tests
  - `build`: Changes that affect the build system or external dependencies
  - `ci`: Changes to our CI configuration files and scripts
  - `chore`: Other changes that don't modify src or test files
  - `revert`: Reverts a previous commit

- **scope** (optional): Specifies the place of the commit change (e.g., component, page, module name)

- **subject**: A concise description of the change
  - Use the imperative, present tense: "change" not "changed" nor "changes"
  - Don't capitalize the first letter
  - No dot (.) at the end

### Body

The body is optional but highly encouraged for explaining the motivation behind the change, and should include:

- Why the change was necessary
- How it addresses the issue
- Any potential side effects or additional information

### Footer

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit **Closes**.

Breaking changes should start with the phrase `BREAKING CHANGE:` followed by a space or a newline.

## Examples

```
feat(auth): add login functionality

Implement user login with email and password
Add form validation and error handling
Setup authentication service integration

Closes #123
```

```
fix(mood-card): correct like button behavior

Fixed the issue where the like button would not update correctly when clicked.
Added proper state management to ensure UI is in sync with the like status.

Fixes #456
```

```
docs(readme): add installation guide

Added step-by-step instructions for installing and configuring the application locally.
Included troubleshooting tips for common issues.
```

```
style(components): improve formatting consistency

Updated formatting across all UI components to ensure consistent style.
No functional changes.
```

```
refactor(mood-creator): simplify color selection logic

Simplified the gradient color selection algorithm to make it more maintainable.
No functional changes or UI modifications.
```

## Commit Tools

To help enforce these conventions, this project uses:

- **Commitlint**: Checks if your commit messages meet the conventional commit format
- **Husky**: Hooks into the commit process to run linting before commits are confirmed
- **Commit template**: A template to guide developers when writing commit messages

Use the provided commit message template with:

```
git commit -t commit-template.txt
```

## Why Use Conventional Commits?

1. **Automatically generating CHANGELOGs.**
2. **Automatically determining a semantic version bump.**
3. **Communicating the nature of changes to teammates and stakeholders.**
4. **Making it easier for people to contribute to the project.**
5. **Making development and maintenance more sustainable over time.**
