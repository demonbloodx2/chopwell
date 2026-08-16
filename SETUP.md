# Chopwell Development Setup Guide

This guide will help you get Chopwell running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ or 22+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
  - Required for local Supabase
  - Make sure Docker is running before starting Supabase
- **Expo CLI** (optional, but recommended)
  ```bash
  npm install -g expo-cli
  ```
- **Supabase CLI** (automatically installed if you have Homebrew on macOS)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd chopwell
npm install
```

### 2. Start Local Supabase

**Important:** Make sure Docker Desktop is running first!

```bash
npm run supabase:start
```

This will:
- Start a local Postgres database
- Start Supabase Auth service
- Start Supabase Storage
- Start Supabase Studio (web UI at http://localhost:54323)
- Output your local credentials (already configured in `.env.development`)

The first time you run this, it will download Docker images which may take a few minutes.

### 3. Verify Supabase is Running

```bash
npm run supabase:status
```

You should see output showing all services running. You can also visit:
- **Supabase Studio**: http://localhost:54323 (Database admin UI)
- **API**: http://localhost:54321

### 4. Start the Expo Development Server

```bash
npm start
```

Then choose how to run the app:
- Press `i` for iOS Simulator (macOS only)
- Press `a` for Android Emulator
- Press `w` to run in web browser
- Scan QR code with Expo Go app on your phone

## Environment Configuration

The project uses **local Supabase** for development, which means:

- ✅ `.env.development` contains local credentials (safe to commit)
- ✅ No need to create a cloud Supabase project for local dev
- ⚠️ `.env.production` contains cloud credentials (**never commit**)

### Local Development (.env.development)

Already configured with standard local Supabase credentials:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENVIRONMENT=local
```

These credentials work for everyone's local setup - no configuration needed!

### Production (.env.production)

When deploying to production, create a cloud Supabase project:

1. Go to https://supabase.com
2. Create a new project
3. Copy `.env.example` to `.env.production`
4. Fill in your production project's URL and anon key

## Useful Commands

### Supabase Commands

```bash
# Start local Supabase (requires Docker)
npm run supabase:start

# Stop local Supabase
npm run supabase:stop

# Check Supabase status
npm run supabase:status

# Reset database (WARNING: deletes all data)
npm run supabase:reset

# Create a new migration
npm run db:migrate <migration_name>

# Push migrations to local DB
npm run db:push
```

### App Commands

```bash
# Start Expo dev server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Code quality
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Format code
npm run type-check    # TypeScript validation
```

## Database Migrations

Migrations are stored in `supabase/migrations/`. To create a new migration:

```bash
npm run db:migrate add_users_table
```

This creates a new migration file in `supabase/migrations/`. Edit it to add your SQL:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);
```

Apply migrations to your local database:

```bash
npm run db:push
```

## Troubleshooting

### Docker Issues

**Error: "Cannot connect to Docker daemon"**

Solution: Make sure Docker Desktop is running.

```bash
# On macOS, start Docker Desktop from Applications
# Or check if it's running:
docker ps
```

### Supabase Won't Start

**Error: "Port 54321 already in use"**

Solution: Another Supabase instance might be running.

```bash
# Stop all Supabase instances
npm run supabase:stop

# Or kill the process using the port
lsof -ti:54321 | xargs kill -9

# Then start again
npm run supabase:start
```

### Expo Issues

**Error: "Metro bundler won't start"**

Solution: Clear Metro cache and restart.

```bash
npx expo start --clear
```

### Environment Variables Not Loading

**Issue: App can't connect to Supabase**

Solution: Make sure you're using the right environment file.

```bash
# Check which file is being used
cat .env.development

# Should show local Supabase URL
# SUPABASE_URL=http://127.0.0.1:54321
```

## Supabase Studio

When Supabase is running locally, you can access Supabase Studio (database admin UI) at:

**http://localhost:54323**

Here you can:
- Browse your database tables
- Run SQL queries
- View logs
- Test RLS policies
- Manage storage buckets

## Development Workflow

1. **Start Docker Desktop** (if not already running)
2. **Start Supabase**: `npm run supabase:start`
3. **Start Expo**: `npm start`
4. **Code away!**
5. When done: `npm run supabase:stop`

## Production Deployment

When you're ready to deploy:

1. Create a production Supabase project at https://supabase.com
2. Update `.env.production` with your cloud credentials
3. Link your local project to production:
   ```bash
   supabase link --project-ref your-project-ref
   ```
4. Push your migrations to production:
   ```bash
   supabase db push --linked
   ```

See [README.md](./README.md) for full deployment instructions.

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev
- **Project Issues**: [GitHub Issues or Linear]
