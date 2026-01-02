# Local KV Setup Guide

This guide explains how to set up local Redis with REST API proxy for development, matching Vercel's Upstash Redis setup.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- Project dependencies installed (`npm install`)

## Quick Start

1. **Start Local Redis + Proxy**
   ```bash
   npm run redis:start
   ```

2. **Configure Environment**
   Add to `.env.local`:
   ```bash
   USE_LOCAL_KV=true
   UPSTASH_REDIS_REST_URL=http://localhost:8080
   UPSTASH_REDIS_REST_TOKEN=local-dev-token-any-value
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Verify Connection**
   - Check Redis status: `npm run redis:status`
   - Check proxy health: `curl http://localhost:8080/health`
   - Check app health: Visit `http://localhost:3004/api/health`

## Architecture

```
┌─────────────┐     HTTP REST API     ┌──────────────┐     Redis Protocol    ┌──────────┐
│   Next.js   │ ───────────────────> │ REST API     │ ───────────────────> │  Redis   │
│   App       │                       │ Proxy        │                      │ (Docker) │
│             │ <───────────────────  │ (Port 8080)  │ <──────────────────  │ (6379)   │
└─────────────┘                       └──────────────┘                      └──────────┘
```

- **Next.js App**: Uses `@upstash/redis` client (same as production)
- **REST API Proxy**: Translates Upstash REST API format to Redis commands
- **Redis**: Local Redis instance running in Docker

## Docker Services

### Redis
- **Port**: 6379 (internal)
- **Data Persistence**: Yes (volume: `redis-data`)
- **Health Check**: Automatic

### Redis Proxy
- **Port**: 8080 (exposed to host)
- **Purpose**: Translates REST API calls to Redis commands
- **Health Endpoint**: `http://localhost:8080/health`

## Available Commands

```bash
# Start Redis + Proxy
npm run redis:start

# Stop Redis + Proxy
npm run redis:stop

# Restart services
npm run redis:restart

# Check status
npm run redis:status

# View logs
npm run redis:logs

# Clear all data (for testing)
npm run redis:flush
```

## Environment Variables

### Local Development (.env.local)

```bash
# Enable local KV mode
USE_LOCAL_KV=true

# Point to local REST API proxy
UPSTASH_REDIS_REST_URL=http://localhost:8080
UPSTASH_REDIS_REST_TOKEN=local-dev-token-any-value

# Keep development mode
ENVIRONMENT=DEV
NODE_ENV=development
```

### Production (Vercel - Unchanged)

```bash
# Automatically set by Vercel Marketplace
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Automatically set by Vercel
VERCEL=1
ENVIRONMENT=PROD
```

## Troubleshooting

### Redis Not Starting

```bash
# Check Docker is running
docker ps

# Check logs
npm run redis:logs

# Restart services
npm run redis:restart
```

### Connection Errors

1. **Verify Redis is running:**
   ```bash
   npm run redis:status
   ```

2. **Check proxy health:**
   ```bash
   curl http://localhost:8080/health
   ```

3. **Verify environment variables:**
   ```bash
   # Check .env.local has:
   USE_LOCAL_KV=true
   UPSTASH_REDIS_REST_URL=http://localhost:8080
   ```

4. **Check app health endpoint:**
   Visit `http://localhost:3004/api/health` in browser

### Port Conflicts

If ports 6379 or 8080 are already in use:

1. **Edit docker-compose.yml** to use different ports
2. **Update UPSTASH_REDIS_REST_URL** in `.env.local` to match

### Data Persistence

Redis data is stored in Docker volume `redis-data`. To reset:

```bash
# Stop services
npm run redis:stop

# Remove volume (WARNING: Deletes all data)
docker volume rm projectmanager_redis-data

# Start again
npm run redis:start
```

## Migration from File-Based Storage

Once local KV is set up and tested:

1. **Run migration script** (Phase 2):
   ```bash
   npm run migrate-to-local-kv
   ```

2. **Validate migration**:
   - Check all projects appear in UI
   - Verify data integrity
   - Test all features

3. **Switch to KV-only mode** (Phase 5):
   - Remove file-based fallback
   - Use KV exclusively

4. **Archive file storage** (Phase 6):
   - Rename `/pm` to `/pm-backup`

## Production Notes

- **No changes required** for Vercel deployment
- Production continues using Upstash Redis cloud
- Same codebase works in both environments
- Only environment variables differ

## Next Steps

1. ✅ Phase 1: Local KV Setup (Complete)
2. ⏳ Phase 2: Migration Tool
3. ⏳ Phase 3: Dual-Write Mode (Optional)
4. ⏳ Phase 4: Full Migration
5. ⏳ Phase 5: KV-Only Mode
6. ⏳ Phase 6: Archive File Storage

See `MIGRATION_TO_LOCAL_KV_STRATEGY.md` for detailed migration plan.

