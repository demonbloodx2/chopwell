# Chopwell

Ghana-first nutrition & meal planning app. Real food, planned around what you actually need.

## Project Overview

Chopwell is a mobile application built with React Native and Supabase, designed to help Ghanaians plan meals with culturally familiar foods while tracking nutrition goals. The app features an offline-first architecture, ensuring users can browse, plan, and manage their meals even without internet connectivity.

### Key Features (Phase 1)

- **Explore & Recipe Discovery**: Browse recipes by familiar food categories (Soups & Stews, Swallow, Rice & Grain Dishes, etc.)
- **Meal Planning**: Individual meal planning with day-strip navigation and meal slots
- **Nutrition Tracking**: Plain-language daily summaries with the signature Woven Progress Ring visualization
- **Goal-Based Recommendations**: Rule-based recommendation engine aligned with user health goals
- **Offline-First**: Full functionality even without internet connectivity

## Architecture

### Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime)
- **Language**: TypeScript
- **Local Storage**: AsyncStorage
- **State Management**: Offline-first local store with background sync

### Architectural Principles

1. **Offline-First**: Local store is the read source of truth; Supabase is the sync target
2. **Security**: Row Level Security (RLS) enforced on every table at the data layer
3. **Unified Schema**: One Food Item schema for recipes, creator recipes, and vendor items
4. **Last-Write-Wins**: Conflict resolution with logged losing writes

## Project Structure

```
chopwell/
├── src/
│   ├── screens/          # UI screens (Onboarding, Explore, Plan, Understand, Profile)
│   ├── store/            # Local offline-first store
│   ├── sync/             # Sync queue and engine
│   ├── services/         # Supabase client and external services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── constants/        # App constants
│   └── components/       # Reusable UI components
├── assets/               # Images, fonts, etc.
├── .github/              # GitHub Actions CI/CD
└── ...
```

## Getting Started

### Prerequisites

- Node.js 20+ or 22+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for macOS) or Android Emulator
- Supabase account (for backend services)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chopwell
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example environment file and fill in your Supabase credentials:

   ```bash
   cp .env.example .env.development
   ```

   Edit `.env.development` and add your Supabase project details:

   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ENVIRONMENT=development
   ```

   **Important**: Never commit the service role key to the repository. Only use the anon (public) key in the client.

4. **Set up Supabase**

   - Create a Supabase project at https://supabase.com
   - Note your project URL and anon key from the project settings
   - Set up the database schema (migrations coming in future tickets)

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS simulator (macOS only)
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

## Development

### Code Quality

```bash
# Run TypeScript type checking
npm run type-check

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check
```

### Testing

```bash
# Run tests (to be implemented)
npm test
```

## Environment Configuration

The project supports two environments:

- **Development** (`.env.development`): For local development and testing
- **Production** (`.env.production`): For production deployment

Never commit `.env.development` or `.env.production` files. Only `.env.example` should be committed as a template.

## CI/CD

The project uses GitHub Actions for continuous integration:

- **Lint & Test**: Runs on every push and pull request
  - TypeScript type checking
  - ESLint linting
  - Prettier formatting check
  - Tests (when implemented)
  - Build verification

- **Security**: Runs npm audit to check for vulnerabilities

## Offline-First Architecture

### How It Works

1. **Reads**: All UI reads from local AsyncStorage (never blocks on network)
2. **Writes**: Write to local store immediately, then enqueue for background sync
3. **Sync**: Background sync engine processes queue when online
4. **Conflicts**: Last-write-wins with conflict logging

### Key Components

- `src/store/localStore.ts`: Local storage wrapper
- `src/sync/syncQueue.ts`: Write queue management
- `src/sync/syncEngine.ts`: Background sync processor
- `src/services/supabase.ts`: Supabase client configuration

## Security

- **RLS Policies**: Every Supabase table has Row Level Security enabled with explicit policies
- **Client-Side**: Only uses Supabase anon key (public key)
- **Service Role**: Never exposed to client; only used in trusted backend contexts
- **Authentication**: Supabase Auth with session persistence

## Documentation

- **PRD**: Product Requirements Document (in Linear)
- **FRD**: Functional Requirements Document (in Linear)
- **SAD**: System Architecture Document (in Linear)
- **Flow Design**: Screen-by-screen flow documentation (in Linear)
- **Brand Snapshot**: Branding and design system guidelines (in Linear)

## Roadmap

### Phase 1 (Current)

- Individual meal planning
- Recipe discovery and browsing
- Goal-based recommendations
- Nutrition tracking

### Phase 2 (Future)

- Creator-authored recipes
- Community features

### Phase 3 (Future)

- Vendor items and ordering
- Delivery integration

### Phase 4 (Future)

- Professional accounts
- Telehealth/booking

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run linting and type checking
4. Submit a pull request

All pull requests must pass CI checks before merging.

## License

[License information to be added]

## Support

For issues and questions, please use the project's Linear workspace or GitHub issues.
