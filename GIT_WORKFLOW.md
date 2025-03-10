# Git Workflow

This document outlines the Git workflow for the MoodMash project to ensure consistency and maintainability.

## Branching Strategy

We follow a modified GitFlow workflow with the following branches:

### Main Branches

- **main**: The production branch containing the stable code currently deployed to production.
- **develop**: The development branch where feature branches are merged for integration.

### Supporting Branches

- **feature/[feature-name]**: For developing new features.
- **bugfix/[issue-number]**: For fixing bugs.
- **hotfix/[issue-number]**: For urgent fixes to the production environment.
- **release/[version]**: For preparing a new production release.
- **docs/[description]**: For documentation changes only.
- **refactor/[description]**: For code refactoring without changing functionality.

## Branch Naming

All branch names should follow a consistent format:

```
<type>/<scope>-<short-description>
```

Examples:
- `feature/auth-login-form`
- `bugfix/123-like-button-state`
- `hotfix/456-security-vulnerability`
- `release/1.0.0`
- `docs/api-documentation`
- `refactor/mood-card-component`

Branch names should:
- Use lowercase letters and hyphens (kebab-case)
- Be concise but descriptive
- Include ticket/issue number when applicable

## Workflow Process

### Starting a New Feature

1. Create a new feature branch from `develop`:
   ```
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Work on your feature, committing changes following the commit convention.

3. Push your branch to the remote repository:
   ```
   git push -u origin feature/your-feature-name
   ```

4. When the feature is complete, open a pull request to merge your branch into `develop`.

### Fixing a Bug

1. Create a bugfix branch from `develop`:
   ```
   git checkout develop
   git pull origin develop
   git checkout -b bugfix/issue-number-short-description
   ```

2. Fix the bug and commit your changes.

3. Push your branch and open a pull request to `develop`.

### Hotfix Process

For critical bugs in production:

1. Create a hotfix branch from `main`:
   ```
   git checkout main
   git pull origin main
   git checkout -b hotfix/issue-number-short-description
   ```

2. Fix the issue and commit your changes.

3. Open pull requests to both `main` and `develop`.

### Preparing a Release

1. Create a release branch from `develop`:
   ```
   git checkout develop
   git pull origin develop
   git checkout -b release/x.y.z
   ```

2. Make release-specific changes (version numbers, final fixes).

3. Once ready, open pull requests to merge into both `main` and `develop`.

4. After merging to `main`, tag the release:
   ```
   git checkout main
   git pull origin main
   git tag -a vx.y.z -m "Release x.y.z"
   git push origin vx.y.z
   ```

## Pull Requests

All code changes must go through a pull request process:

1. Create a pull request with a descriptive title and detailed description.
2. Link relevant issues or tickets.
3. Assign reviewers.
4. Address review feedback.
5. Once approved, merge your PR.

### PR Title Format

Follow the conventional commits format for PR titles:

```
<type>(<scope>): <short description>
```

Example: `feat(auth): implement login page`

## Code Review Guidelines

- Review PRs within 24 hours when possible
- Provide constructive feedback
- Focus on:
  - Code quality and readability
  - Performance considerations
  - Test coverage
  - Documentation
  - Adherence to project standards

## Commit Guidelines

- Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification
- Use the commit template provided in the project
- Keep commits focused and atomic
- Reference issues in commit messages when applicable

See [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) for detailed commit guidelines.

## Conflict Resolution

When encountering merge conflicts:

1. Pull the latest changes from the target branch:
   ```
   git checkout your-branch
   git pull origin target-branch
   ```

2. Resolve conflicts locally.

3. Test thoroughly after resolving conflicts.

4. Commit the resolved conflicts:
   ```
   git add .
   git commit -m "resolve merge conflicts with target-branch"
   ```

5. Push your changes and continue with the PR process.

## Git Best Practices

- Pull from the base branch before creating a new branch
- Rebase your branch regularly to stay up-to-date with the base branch
- Squash trivial or "fix typo" commits before merging
- Write clear, comprehensive commit messages
- Never force push to shared branches (main, develop)
- Delete branches after they've been merged 