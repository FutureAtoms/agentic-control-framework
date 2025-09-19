# Contributing to Agentic Control Framework

Thank you for your interest in contributing to ACF! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Issues

1. Check existing issues first to avoid duplicates
2. Use issue templates when available
3. Provide detailed reproduction steps
4. Include system information (OS, Node version, etc.)

### Submitting Pull Requests

#### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/agentic-control-framework.git
cd agentic-control-framework

# Add upstream remote
git remote add upstream https://github.com/FutureAtoms/agentic-control-framework.git
```

#### 2. Create a Feature Branch

```bash
# Create branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

#### 3. Make Your Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- Keep commits atomic and well-described

#### 4. Test Your Changes

```bash
# Run the test suite
npm test

# Run linting
npm run lint

# Test specific tools
npm run test:tools
```

#### 5. Commit Guidelines

We follow conventional commits:

```bash
# Format: <type>(<scope>): <subject>

# Examples:
git commit -m "feat(tools): add new browser automation tool"
git commit -m "fix(mcp): resolve connection timeout issue"
git commit -m "docs(setup): update Claude Code configuration"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Maintenance tasks

#### 6. Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Then on GitHub:

1. Navigate to your fork
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] All tests pass
- [ ] Added new tests
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Watch for changes
npm run watch
```

### Code Style

- Use TypeScript for new code
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing Guidelines

- Write unit tests for new functionality
- Maintain >80% code coverage
- Test edge cases and error conditions
- Use descriptive test names

### Documentation

- Update relevant documentation
- Add JSDoc comments for new functions
- Include examples in documentation
- Keep README sections up to date

## Review Process

1. Automated checks run on all PRs
2. Maintainer review required
3. Address review feedback
4. Approval and merge

## Release Process

We use semantic versioning:

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

## Getting Help

- GitHub Discussions: Ask questions
- Issues: Report bugs
- Discord: Join our community

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor highlights

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

Thank you for contributing to ACF! 🚀