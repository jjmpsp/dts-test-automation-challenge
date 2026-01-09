# Login Lab - Test Runner Framework (Node + Selenium + Mochawesome)

Includes:
- Multiple mock login apps (Basic, CSRF, MFA, Lockout)
- Mocha test suites using Selenium WebDriver
- Mochawesome HTML report generated per run
- Screenshots captured on failure and shown in UI

## Ports
- UI: http://localhost:31010
- API: http://localhost:41010
- Mock apps:
  - Basic: http://localhost:51010
  - CSRF: http://localhost:51011
  - MFA: http://localhost:51012
  - Lockout: http://localhost:51013

## Run
```bash
docker compose up --build
```
Open UI and run tests.

Artifacts are served via the API at `/artifacts/...`
