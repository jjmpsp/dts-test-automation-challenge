# Login Lab Test Runner Framework Documentation

## Overview
The Login Lab Test Runner Framework is a comprehensive automated testing platform designed to validate various authentication mechanisms and security controls. It includes multiple mock login applications and runs comprehensive test suites using Selenium WebDriver with detailed reporting and screenshot capture capabilities.

## Technologies Used

### Core Technologies
- **Node.js**: Runtime environment for JavaScript execution
- **Selenium WebDriver**: Browser automation framework for UI testing
- **Mocha**: JavaScript test framework running on Node.js
- **Chai**: Assertion library for BDD/TDD assertions
- **Express.js**: Web application framework for API and frontend servers
- **Vite**: Build tool and development server with hot module replacement

### Testing & Reporting
- **Mochawesome**: Customizable HTML reporter for Mocha tests
- **Mochawesome Report Generator**: Generates detailed HTML reports with test results
- **Winston**: Logging library for application logging

### Infrastructure
- **Docker**: Containerization platform for consistent deployment
- **Docker Compose**: Multi-container orchestration
- **UUID**: Library for generating unique identifiers

### Frontend Development
- **Vite**: Fast build tool and development server
- **CORS**: Cross-Origin Resource Sharing middleware
- **HTTP Proxy Middleware**: Proxy functionality for development

## Project Architecture

The project follows a microservices architecture with the following components:

### Services
1. **API Service** (`services/api`) - Serves artifacts and manages test runs
2. **Frontend Service** (`services/frontend`) - User interface for running and viewing tests
3. **Runner Service** (`services/runner`) - Executes test suites using Selenium
4. **Mock Apps** (`services/mock-apps/*`) - Various authentication scenarios

### Mock Applications
The framework includes multiple mock applications to test different authentication scenarios:
- **Basic Authentication** (`basic`) - Standard username/password login
- **CSRF Protection** (`csrf`) - Tests Cross-Site Request Forgery protections
- **Multi-Factor Authentication** (`mfa`) - OTP-based second factor authentication
- **Account Lockout** (`lockout`) - Account lockout after failed attempts
- **Session Fixation** (`session-fixation`) - Session management vulnerabilities
- **Password Policy** (`password-policy`) - Password complexity requirements
- **Rate Limiting** (`rate-limiting`) - Request rate limiting mechanisms
- **Account Enumeration** (`account-enumeration`) - Username enumeration vulnerabilities

## Test Scenarios

### Scenario Definition
Test scenarios are defined in [`services/runner/src/scenarios.js`](services/runner/src/scenarios.js) with unique IDs mapping to specific test files:

```javascript
module.exports = {
  "s-basic-0001": ["src/tests/basic.spec.js"],
  "s-csrf-0001": ["src/tests/csrf.spec.js"],
  "s-mfa-0001": ["src/tests/mfa.spec.js"],
  "s-lockout-0001": ["src/tests/lockout.spec.js"],
  "s-session-fixation-0001": ["src/tests/session-fixation.spec.js"],
  "s-password-policy-0001": ["src/tests/password-policy.spec.js"],
  "s-rate-limiting-0001": ["src/tests/rate-limiting.spec.js"],
  "s-account-enumeration-0001": ["src/tests/account-enumeration.spec.js"]
};
```

### Individual Test Cases

#### Basic Authentication Tests ([`services/runner/src/tests/basic.spec.js`](services/runner/src/tests/basic.spec.js))
- **Basic - invalid credentials shows error**: Verifies error message appears with wrong credentials
- **Basic - empty fields show validation**: Checks validation for empty login fields
- **Basic - valid credentials logs in**: Confirms successful login with correct credentials

#### MFA Authentication Tests ([`services/runner/src/tests/mfa.spec.js`](services/runner/src/tests/mfa.spec.js))
- **MFA - valid credentials then valid OTP succeeds**: Tests successful MFA login
- **MFA - invalid OTP fails**: Verifies rejection of incorrect OTP
- **MFA - expired OTP fails**: Confirms expiration handling for OTP codes

#### Other Test Categories
Similar test structures exist for CSRF, lockout, session fixation, password policy, rate limiting, and account enumeration scenarios.

### Test Framework Components
- **Driver Factory** ([`services/runner/src/framework/driverFactory.js`](services/runner/src/framework/driverFactory.js)): Creates and configures Selenium WebDriver instances
- **Hooks** ([`services/runner/src/framework/hooks.js`](services/runner/src/framework/hooks.js)): Manages test lifecycle events including screenshot capture
- **Run Mocha** ([`services/runner/src/runMocha.js`](services/runner/src/runMocha.js)): Orchestrates test execution and result processing

## Screenshots and Test Results Documentation

### Screenshot Capture Mechanism
Screenshots are automatically captured during test execution using the hooks system:

#### Types of Screenshots
1. **Failure Screenshots**: Captured when a test fails using `screenshotOnFailure()` function
2. **All Test Screenshots**: Captured for every test regardless of outcome using `screenshotOnTest()` function

#### Screenshot Storage
- **Location**: `artifacts/runs/{runId}/screenshots/`
- **Naming Convention**: `{timestamp}_{testName}.png` for failures, `{timestamp}_{testName}_all.png` for all tests
- **Format**: PNG images stored with Base64 encoding

#### Screenshot Function Implementation
```javascript
async function screenshotOnFailure(driver, test, runId, artifactsDir) {
  if (!driver) return null;
  const shotsDir = path.join(artifactsDir, "runs", runId, "screenshots");
  ensureDir(shotsDir);
  const filename = `${Date.now()}_${safeName(test.fullTitle())}.png`;
  const filepath = path.join(shotsDir, filename);
  const imgBase64 = await driver.takeScreenshot();
  fs.writeFileSync(filepath, imgBase64, "base64");

  addContext(test, { title: "Screenshot on failure", value: path.relative(process.cwd(), filepath) });
  return { name: filename, filepath, url: `/artifacts/runs/${runId}/screenshots/${filename}` };
}
```

### Test Results Handling
#### Report Generation
- **Format**: Mochawesome HTML and JSON reports
- **Location**: `artifacts/runs/{runId}/mochawesome-report/`
- **Files**: `index.html` (human-readable), `index.json` (structured data)

#### Result Processing
The system processes test results in real-time:
1. **Execution**: Tests run through Mocha with custom reporter options
2. **Collection**: Results aggregated from mochawesome JSON output
3. **Processing**: Flattened test results with status, duration, and error information
4. **Storage**: Results linked to run ID and associated with screenshots

#### Test Data Structure
Each test result includes:
- `title`: Full test title
- `status`: Pass/fail/pending/unknown status
- `duration_ms`: Execution time in milliseconds
- `err`: Error message or stack trace (if applicable)

#### Artifacts Organization
```
artifacts/
└── runs/
    └── {runId}/
        ├── mochawesome-report/
        │   ├── index.html
        │   ├── index.json
        │   └── assets/
        └── screenshots/
            ├── {timestamp}_{testName}.png
            └── {timestamp}_{testName}_all.png
```

### API Integration
The API service serves artifacts via endpoints:
- `/artifacts/runs/{runId}/mochawesome-report/index.html` - Test reports
- `/artifacts/runs/{runId}/screenshots/{filename}` - Individual screenshots

## Running the Application

### Prerequisites
- Docker and Docker Compose
- Node.js (for development)

### Deployment
```bash
docker-compose up --build
```

### Service URLs
- **UI**: http://localhost:31010
- **API**: http://localhost:41010
- **Mock Apps**:
  - Basic: http://localhost:51010
  - CSRF: http://localhost:51011
  - MFA: http://localhost:51012
  - Lockout: http://localhost:51013
  - Session Fixation: http://localhost:51014
  - Password Policy: http://localhost:51015
  - Rate Limiting: http://localhost:51016
  - Account Enumeration: http://localhost:51017

## Development Setup
For development with hot reloading:
```bash
# Install frontend dependencies
cd services/frontend
npm install

# Run with development configuration
docker-compose -f docker-compose.dev.yml up --build
```

This setup enables hot reload for frontend files and mounts volumes for immediate reflection of changes.

## Adding New Tests

To add new tests to the framework, follow these steps:

### 1. Create a New Mock Application (if needed)
If your test scenario requires a new type of authentication or security control, create a new mock app in the `services/mock-apps/` directory:

```bash
cd services/mock-apps
mkdir my-new-app
cd my-new-app
# Create package.json, Dockerfile, and src/server.js for your mock app
```

The mock app should expose an HTTP server with the login functionality you want to test.

### 2. Update docker-compose.yml
Add your new mock app service to the `docker-compose.yml` file with a unique port number (typically incrementing from the last port used):

```yaml
  mock-app-my-new-app:
    build: ./services/mock-apps/my-new-app
    ports:
      - "51018:51018"  # Use next available port
    environment:
      PORT: "51018"
```

### 3. Create Test Files
Create your test file in `services/runner/src/tests/` following the naming convention `my-new-app.spec.js`. The test file should use Mocha and Selenium WebDriver to implement your test cases:

```javascript
const { Builder, By, until } = require('selenium-webdriver');
const assert = require('chai').assert;
const { screenshotOnTest, screenshotOnFailure } = require('../framework/hooks');

describe('My New App', function() {
  let driver;
  const runId = process.env.RUN_ID || 'unknown';
  const artifactsDir = process.env.ARTIFACTS_DIR || '/artifacts';
  const baseUrl = process.env.BASE_URL || 'http://localhost:51018';

  this.timeout(30000); // 30 seconds timeout for all tests in this suite
  this.slow(5000);    // Consider tests slow if they take more than 5 seconds

  before(async function() {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  it('My New App - test description', async function() {
    try {
      await driver.get(baseUrl);
      // Add your test steps here
      // Example: await driver.findElement(By.name('username')).sendKeys('testuser');
      // Example: await driver.findElement(By.name('password')).sendKeys('password');
      // Example: await driver.findElement(By.css('button[type="submit"]')).click();
      
      // Add assertions to verify expected behavior
      // Example: const element = await driver.wait(until.elementLocated(By.id('welcome')), 5000);
      // Example: assert.isTrue(await element.isDisplayed());
      
      // Capture screenshot for all tests
      await screenshotOnTest(driver, this.test, runId, artifactsDir);
    } catch (error) {
      // Capture screenshot on failure
      await screenshotOnFailure(driver, this.test, runId, artifactsDir);
      throw error; // Re-throw the error to mark test as failed
    }
  });
});
```

### 4. Update Runner Scenarios
Add your new test file to the scenarios configuration in `services/runner/src/scenarios.js` with a unique scenario ID:

```javascript
module.exports = {
  // ... existing scenarios ...
  "s-my-new-app-0001": ["src/tests/my-new-app.spec.js"]
};
```

Use a descriptive ID with the format `s-[category]-[number]` where the number follows sequentially from existing IDs in that category.

### 5. Update API Server Scenarios
Add your scenario definition to the API server in `services/api/src/server.js` within the scenarios array. Include the scenario ID, type, title, target URL (using the Docker service name and port), and the list of test titles that match your test file implementation:

```javascript
const scenarios = [
  // ... existing scenarios ...
  {
    id: "s-my-new-app-0001",
    type: "my-new-app",
    title: "My New App - description of the functionality being tested",
    targetBaseUrl: "http://mock-app-my-new-app:51018",  // Use Docker service name and port
    tests: [
      "My New App - test description"  // These should match the test titles in your spec file
    ]
  }
];
```

The `targetBaseUrl` should use the Docker service name (from docker-compose.yml) rather than localhost, since services communicate within the Docker network.

### 6. Build and Test
After making all changes, rebuild and restart the services to apply your new test scenario:

```bash
docker-compose down
docker-compose build api runner my-new-app  # Replace 'my-new-app' with your actual service name
docker-compose up -d
```

Your new test scenario should now appear in the frontend dropdown and be available for execution. You can verify this by accessing the API endpoint `http://localhost:41010/api/scenarios` to confirm your new scenario is included in the response.