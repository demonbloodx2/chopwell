# Chopwell - Quick Start

Get up and running in 3 steps:

## 1. Start Docker Desktop

**macOS**: Open Docker Desktop from Applications

**Check if running**:

```bash
docker ps
```

If you see a table output, Docker is running ✓

## 2. Start Local Supabase

```bash
npm run supabase:start
```

⏱️ **First time?** This will download Docker images (~2-5 minutes)

✅ **When ready**, you'll see:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

🎨 **Open Supabase Studio**: http://localhost:54323 (database admin UI)

## 3. Start the App

```bash
npm start
```

Then:

- Press `i` for iOS Simulator (macOS only)
- Press `a` for Android Emulator
- Press `w` for web browser
- Scan QR code with Expo Go app

## Common Issues

### "Cannot connect to Docker daemon"

**Solution**: Docker Desktop isn't running. Start it and try again.

### "Port 54321 already in use"

**Solution**: Supabase is already running or something else is using the port.

```bash
# Stop Supabase
npm run supabase:stop

# Or kill the process
lsof -ti:54321 | xargs kill -9

# Then start again
npm run supabase:start
```

### App can't connect to Supabase

**Solution**: Make sure Supabase is running.

```bash
# Check status
npm run supabase:status

# Should show all services as "healthy"
```

## Daily Workflow

```bash
# Morning
npm run supabase:start
npm start

# Code all day 🚀

# Evening
npm run supabase:stop
```

## Next Steps

- See [SETUP.md](./SETUP.md) for detailed setup guide
- See [README.md](./README.md) for full documentation
