# Docker Setup for Local KV

## Starting Docker

### macOS

1. **Open Docker Desktop**
   - Launch Docker Desktop from Applications
   - Wait for Docker to start (whale icon in menu bar should be steady)
   - You'll see "Docker Desktop is running" when ready

2. **Verify Docker is running:**
   ```bash
   docker ps
   ```
   Should show empty list (no error)

### Alternative: Start Docker from Terminal

```bash
# Open Docker Desktop
open -a Docker

# Wait a few seconds, then verify
docker ps
```

## Starting Local Redis

Once Docker is running:

```bash
# Start Redis + Proxy
npm run redis:start

# Verify they're running
npm run redis:status

# Check logs if needed
npm run redis:logs
```

## Troubleshooting

### "Cannot connect to Docker daemon"

**Solution:**
1. Open Docker Desktop application
2. Wait for it to fully start (check menu bar icon)
3. Try again: `npm run redis:start`

### Docker Desktop Not Installed

**Install Docker Desktop:**
- macOS: Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
- Or use Homebrew: `brew install --cask docker`

### Port Already in Use

If ports 6379 or 8080 are already in use:

1. **Check what's using the port:**
   ```bash
   # macOS
   lsof -i :6379
   lsof -i :8080
   ```

2. **Stop the conflicting service** or **change ports in docker-compose.yml**

## Alternative: Local Redis Without Docker

If you prefer not to use Docker, you can install Redis directly:

### macOS (Homebrew)

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Redis will run on localhost:6379
```

**Note:** You'll still need the REST API proxy. You can run it separately:

```bash
# Install proxy dependencies
npm install express redis

# Run proxy manually
node scripts/redis-proxy.js
```

Then configure `.env.local`:
```bash
USE_LOCAL_KV=true
UPSTASH_REDIS_REST_URL=http://localhost:8080
UPSTASH_REDIS_REST_TOKEN=local-dev-token
```

