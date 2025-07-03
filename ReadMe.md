# Briefly Desktop

An AI-powered newsletter reading application built with Electron, React, and Supabase.

## Overview

Briefly Desktop transforms newsletter overload into a curated, prioritized reading experience. The app uses AI-powered content scoring to help you focus on the most important stories while providing a distraction-free reading environment.

## Features

### Core Features
- **AI Content Prioritization**: Stories ranked by importance using machine learning
- **Smart Views**: Pre-configured filters like "Today's Digest", "Quick Reads", "Deep Dives"
- **Advanced Search**: Full-text search across titles, content, and metadata
- **Reading Analytics**: Track reading progress, time spent, and completion rates
- **Cross-Platform**: Native apps for Windows, macOS, and Linux

### Reading Experience
- **Distraction-Free Reading**: Clean, customizable reading interface
- **Reading Progress Tracking**: Automatic reading progress and completion detection
- **Customizable Typography**: Adjustable font size, line height, and content width
- **Dark/Light Mode**: System preference integration with manual override
- **Keyboard Shortcuts**: Navigate efficiently with keyboard controls

### Sync & Storage
- **Real-Time Sync**: Bidirectional sync with Supabase backend
- **Optimistic Updates**: Immediate UI updates with eventual consistency

## Tech Stack

### Frontend
- **Electron 28+**: Cross-platform desktop app framework
- **React 18**: UI framework with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Headless UI**: Accessible UI components
- **Framer Motion**: Smooth animations and transitions

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state management and caching
- **Persistent Storage**: Local state persistence

### Backend & Data
- **Supabase**: Backend-as-a-Service with real-time features
- **SQLite**: Local database (coming soon - currently using mock data)
- **Real-time Subscriptions**: Live data updates

### Development Tools
- **Vite**: Fast development build tool
- **ESLint**: Code linting and formatting
- **Electron Builder**: Cross-platform app packaging

## Getting Started

### Prerequisites
- Node.js 18+ (recommended: use nvm)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Briefly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

This will start both the Vite development server (React app) and Electron main process. The app will open automatically.

### Development Scripts

```bash
# Start development server (React + Electron)
npm run dev

# Build React app only
npm run build:vite

# Build Electron main process
npm run build:electron

# Build complete app for distribution
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## Project Structure

```
Briefly/
├── electron/                 # Electron main process files
│   ├── main.ts              # Main Electron process
│   └── preload.ts           # Preload script for secure IPC
├── src/
│   ├── components/          # React components
│   │   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   │   ├── stories/         # Story-related components
│   │   ├── reading/         # Reading view components
│   │   ├── search/          # Search functionality
│   │   └── settings/        # Settings and preferences
│   ├── stores/              # State management (Zustand stores)
│   ├── types/               # TypeScript type definitions
│   ├── lib/                 # Utility libraries and services
│   ├── hooks/               # Custom React hooks
│   └── utils/               # Helper functions
├── assets/                  # Static assets (icons, images)
├── dist-renderer/           # Built React app (generated)
├── dist-main/               # Built Electron process (generated)
└── build/                   # Final app packages (generated)
```

### Component Architecture

The app follows a modular component architecture:

- **Layout Components**: Handle overall app structure and navigation
- **Feature Components**: Implement specific functionality (stories, reading, search)
- **Shared Components**: Reusable UI components and utilities
- **Hooks**: Encapsulate business logic and side effects

### State Management

- **Zustand**: Global app state (stories, filters, settings)
- **React Query**: Server state and caching

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a new Supabase project
2. Set up the stories table with the following schema:
   ```sql
   CREATE TABLE stories (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES auth.users NOT NULL,
     publication_name text NOT NULL,
     title text NOT NULL,
     summary text,
     content text NOT NULL,
     importance_score integer DEFAULT 0,
     is_read boolean DEFAULT false,
     is_bookmarked boolean DEFAULT false,
     category text,
     read_time_minutes integer,
     source_url text,
     author text,
     published_at timestamp with time zone,
     created_at timestamp with time zone DEFAULT now(),
     updated_at timestamp with time zone DEFAULT now()
   );
   ```

## Development Status

### ✅ Completed Features
- [x] Project setup and configuration
- [x] Electron + React + TypeScript foundation
- [x] Component architecture and routing
- [x] State management with Zustand
- [x] Story feed with filtering and sorting
- [x] Reading view with progress tracking
- [x] Search functionality
- [x] Settings and preferences
- [x] Theme management (light/dark/auto)
- [x] Mock data for development

### 🚧 In Progress
- [ ] SQLite local database integration
- [ ] Supabase real-time sync
- [ ] Advanced filtering and smart views
- [ ] Reading analytics and metrics
- [ ] Keyboard shortcuts and navigation

### 📋 Planned Features
- [ ] Story content extraction and processing
- [ ] AI-powered importance scoring
- [ ] Import from popular newsletter services
- [ ] Export and sharing capabilities
- [ ] Advanced search with filters
- [ ] Reading goals and statistics
- [ ] Notification system
- [ ] Auto-updater

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing component structure
- Add JSDoc comments for all functions
- Keep files under 500 lines when possible
- Use descriptive variable names with auxiliary verbs

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Electron](https://electronjs.org/)
- UI components from [Headless UI](https://headlessui.dev/)
- Icons from [Heroicons](https://heroicons.com/)
- Backend powered by [Supabase](https://supabase.com/)

---

**Note**: This is currently a development version with mock data. SQLite integration and Supabase sync are being implemented for the production version.
