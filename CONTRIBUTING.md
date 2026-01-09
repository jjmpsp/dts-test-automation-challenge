# Contributing to Login Lab Test Automation Framework

Thank you for your interest in contributing to the Login Lab Test Automation Framework! This document outlines the process for contributing to this project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming and respectful environment for everyone.

## How Can I Contribute?

### Reporting Bugs

- Check the issue tracker to see if the bug has already been reported
- Use a clear and descriptive title for the issue
- Include detailed steps to reproduce the bug
- Specify the environment where the bug occurs (OS, Node.js version, etc.)
- Include any relevant logs, screenshots, or error messages

### Suggesting Features

- Explain the feature clearly with use cases
- Describe the expected behavior
- Consider the impact on existing functionality
- Submit feature requests as issues with the "enhancement" label

### Pull Requests

1. Fork the repository
2. Create a branch for your changes (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards
4. Add tests if applicable
5. Update documentation as needed
6. Ensure all tests pass
7. Commit your changes with a clear, descriptive commit message
8. Push to your fork (`git push origin feature/amazing-feature`)
9. Create a pull request

## Development Setup

### Prerequisites

- Node.js (v14 or higher recommended)
- Docker and Docker Compose
- Git

### Getting Started

1. Clone your fork:
```bash
git clone https://github.com/your-username/login-lab-framework.git
cd login-lab-framework
```

2. Install dependencies:
```bash
cd services/frontend
npm install
```

3. Run the development environment:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Coding Standards

### JavaScript

- Follow the existing code style
- Use meaningful variable and function names
- Write clear comments for complex logic
- Ensure code is properly formatted (use Prettier if available)

### Docker

- Follow Docker best practices
- Minimize image size
- Use multi-stage builds where appropriate
- Keep Dockerfiles clean and well-commented

### Documentation

- Update README.md if adding new features
- Keep documentation clear and accurate
- Use proper Markdown formatting

## Adding New Test Scenarios

To add new test scenarios to the framework:

1. Create a new mock application in `services/mock-apps/`
2. Add your test file to `services/runner/src/tests/`
3. Update `services/runner/src/scenarios.js` with your new scenario
4. Update the API server configuration in `services/api/src/server.js`
5. Test your changes thoroughly

## Testing

Before submitting a pull request:

1. Ensure all existing tests pass
2. Add new tests for your changes if applicable
3. Test manually in the UI to verify functionality
4. Verify Docker deployment works correctly

## Commit Messages

- Use the imperative mood ("Add feature" not "Added feature")
- Start with a capital letter
- Keep the first line under 72 characters
- Reference issues and pull requests when relevant

## Questions?

If you have questions about contributing, feel free to open an issue or contact the maintainers.

Thank you for contributing!