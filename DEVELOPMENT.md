# Development Setup

This project now includes a Vite-powered development environment with hot module replacement for faster development.

## Prerequisites

Make sure you have Node.js and Docker installed on your system.

## Development Commands

### For Development (with hot reload):

1. Install dependencies:
```bash
cd services/frontend
npm install
```

2. Run the development setup with Docker Compose:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will:
- Start all services (API, frontend, runner, mock apps)
- Enable hot reload for frontend files (HTML, CSS, JS)
- Mount volumes so changes are reflected immediately

### For Production:

Use the standard docker-compose command:
```bash
docker-compose up --build
```

## How Hot Reload Works

- Changes to files in `services/frontend/public/` are automatically detected
- Browser will reload or components will update without manual refresh
- API calls are proxied through the development server to the backend

## Troubleshooting

- If you see permission errors with volumes, make sure your Docker daemon is running
- If changes aren't reflected, try refreshing the browser
- For any dependency issues, run `npm install` in the services/frontend directory