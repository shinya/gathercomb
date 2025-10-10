# Gathercomb

Miro/Figma-like online collaboration tool for sticky notes - OSS

## Features

- **Real-time collaborative editing** with instant synchronization
- **Multiple shape types**: Sticky notes, rectangles, circles, and text shapes
- **Interactive canvas** with zoom, pan, and drag-and-drop support
- **Text editing** with double-click to edit functionality
- **Shape manipulation**: Move, resize, rotate, and delete shapes
- **Color customization** with built-in color palette
- **Context menus** for quick actions (delete, change color)
- **Offline editing** with automatic merge on reconnection
- **User presence** (cursors, selections)
- **Board management** with role-based access control
- **Self-hosted** with Docker

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

## Usage

### Creating Shapes

1. **Select a tool** from the toolbar at the top of the canvas:
   - 📝 **Sticky Note**: Create editable sticky notes
   - ⬜ **Rectangle**: Create rectangular shapes
   - ⭕ **Circle**: Create circular shapes
   - 📄 **Text**: Create standalone text elements

2. **Click on the canvas** to place the shape at the center of your view

3. **Customize colors** using the color palette in the toolbar

### Editing Shapes

- **Double-click** on any text element (sticky notes or text shapes) to edit
- **Drag** shapes to move them around the canvas
- **Resize** shapes using the selection handles
- **Right-click** for context menu options (delete, change color)
- **Pan the canvas** by dragging on empty areas
- **Zoom** using mouse wheel or zoom controls

### Collaboration

- All changes are **synchronized in real-time** with other users
- See other users' **cursors and selections**
- **Offline editing** is supported - changes sync when you reconnect

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
npm run lint
npm run format

# Type checking
npm run type-check
```

### Project Structure

```
apps/
├── web/                 # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   │   └── canvas/  # Canvas-related components
│   │   ├── stores/      # Zustand state management
│   │   ├── yjs/         # Yjs CRDT integration
│   │   └── pages/       # Page components
└── server/              # Node.js backend application
    ├── src/
    │   ├── routes/      # API routes
    │   ├── services/    # Business logic
    │   └── utils/       # Utility functions
packages/
└── shared/              # Shared TypeScript types and schemas
```

## Email Testing

For local development, we use Mailcatcher to catch and display emails:

- **Web Interface**: http://localhost:1080
- **SMTP Server**: localhost:1025 (no authentication required)

When you sign up or invite users to boards, emails will be captured by Mailcatcher and displayed in the web interface for easy testing.

## Recent Updates

### v0.2.0 - Enhanced Shape Support (Latest)

- ✅ **Fixed text editing issues** - Double-click editing now works properly with zoom/pan
- ✅ **Improved canvas interaction** - Pan canvas by dragging empty areas
- ✅ **Enhanced real-time sync** - Instant synchronization between users
- ✅ **Added new shape types**:
  - Rectangles with customizable fill and stroke
  - Circles with customizable fill and stroke
  - Standalone text elements with font customization
- ✅ **Redesigned toolbar** - Horizontal layout with icon-based tools
- ✅ **Improved context menus** - Stable positioning and better UX
- ✅ **Enhanced selection feedback** - Visual indicators for selected shapes

### Key Improvements

- **Better UX**: Fixed all major usability issues with text editing and canvas navigation
- **More Shape Types**: Beyond sticky notes, now supports rectangles, circles, and text
- **Real-time Performance**: Optimized synchronization for instant updates
- **Modern UI**: Clean, intuitive toolbar design with tooltips

## License

Apache-2.0
