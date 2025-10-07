# Gathercomb

Miro/Figma-like online collaboration tool for sticky notes - OSS

## Features

- Real-time collaborative sticky notes editing
- Offline editing with automatic merge on reconnection
- Canvas-based UI with zoom/pan support
- User presence (cursors, selections)
- Board management with role-based access control
- Self-hosted with Docker

## Tech Stack

- **Frontend**: React + Yjs (CRDT) + y-websocket + react-konva (Canvas)
- **Backend**: Node.js (Express) + y-websocket server
- **Database**: PostgreSQL
- **Authentication**: Self-hosted login (Argon2id + session cookies)

## Quick Start

```bash
# Install dependencies
npm install

# Start development environment with Docker Compose
docker-compose up -d

# Access the application
open http://localhost:3000

# Access mailcatcher (for email testing)
open http://localhost:1080
```

## Development

```bash
# Install dependencies
npm install

# Start web app
npm run dev:web

# Start server
npm run dev:server

# Run tests
npm test

# Lint and format
npm lint
npm format
```

## Email Testing

For local development, we use Mailcatcher to catch and display emails:

- **Web Interface**: http://localhost:1080
- **SMTP Server**: localhost:1025 (no authentication required)

When you sign up or invite users to boards, emails will be captured by Mailcatcher and displayed in the web interface for easy testing.

## License

Apache-2.0
