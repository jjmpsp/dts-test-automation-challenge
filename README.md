# Login Lab Test Automation Framework

A comprehensive test automation framework built with Node.js, Selenium WebDriver, and Mocha for validating authentication mechanisms and security controls.

## 🚀 Overview

This project demonstrates advanced test automation capabilities by implementing a modular framework that validates various authentication scenarios including basic authentication, CSRF protection, multi-factor authentication, account lockout, and other security controls. The solution follows modern software engineering principles with containerization, comprehensive reporting, and a user-friendly interface.

## ✨ Key Features

- **Multi-Service Architecture**: Microservices-based design with dedicated services for API, frontend, test runner, and mock applications
- **Comprehensive Test Coverage**: Supports 8+ authentication scenarios with dedicated mock applications
- **Advanced Reporting**: HTML reports with detailed results and automatic screenshot capture on failures
- **Containerized Deployment**: Docker and Docker Compose for consistent, reproducible environments
- **Modern Frontend**: User-friendly interface built with Vite for test execution and result visualization
- **Extensible Design**: Modular architecture supporting easy addition of new test scenarios

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Testing Framework**: Selenium WebDriver, Mocha, Chai
- **Build Tools**: Vite, Docker, Docker Compose
- **Reporting**: Mochawesome HTML reports
- **Frontend**: JavaScript, HTML, CSS

## 📁 Project Structure

```
├── services/
│   ├── api/              # REST API for test management
│   ├── frontend/         # User interface for test execution
│   ├── runner/           # Selenium test execution engine
│   └── mock-apps/        # Multiple authentication scenarios
├── artifacts/            # Test results and screenshots
├── docs/                 # Documentation
└── README.md
```

## 🏗️ Architecture

The framework consists of multiple interconnected services:

- **API Service**: Manages test runs and serves artifacts
- **Frontend Service**: Provides intuitive UI for running and viewing tests
- **Runner Service**: Executes test suites using Selenium WebDriver
- **Mock Applications**: Multiple authentication scenarios for testing

## 🧪 Supported Test Scenarios

- Basic Authentication (username/password)
- CSRF Protection Validation
- Multi-Factor Authentication (MFA)
- Account Lockout Mechanisms
- Session Fixation Prevention
- Password Policy Enforcement
- Rate Limiting Controls
- Account Enumeration Prevention

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/jjmpsp/dts-test-automation-challenge.git
cd login-lab-framework
```

2. Build and start the services:
```bash
docker-compose up --build
```

3. Access the application:
   - UI: [http://localhost:31010](http://localhost:31010)
   - API: [http://localhost:41010](http://localhost:41010)

4. Run tests through the UI or API endpoints

## 🔧 Development

For development with hot reloading:

1. Install frontend dependencies:
```bash
cd services/frontend
npm install
```

2. Run development setup:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

## 📊 Test Results

- **Reports**: Generated in HTML format with detailed execution results
- **Screenshots**: Automatic capture on test failures for debugging
- **Artifacts**: Organized storage of test results and evidence

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐙 Repository Structure

```
├── .github/                  # GitHub workflows and templates
├── services/                 # Microservices
│   ├── api/                  # API service
│   ├── frontend/             # Frontend service  
│   ├── runner/               # Test runner service
│   └── mock-apps/            # Authentication mock apps
├── docs/                     # Documentation
├── artifacts/                # Test results (gitignored)
├── docker-compose.yml        # Production deployment
├── docker-compose.dev.yml    # Development deployment
├── README.md                 # This file
├── DEVELOPMENT.md            # Development guide
├── PROJECT_DOCUMENTATION.md  # Technical documentation
├── Future-Improvements.md    # Future roadmap
└── LICENSE                   # License information
```

---

Made with ❤️ for test automation excellence
