# Local KV Environment Variables Setup

## Quick Answer

**You don't "get" these values - you SET them yourself in `.env.local`!**

These are configuration values you choose for local development. Here's what each one means:

## Environment Variables Explained

### 1. `USE_LOCAL_KV=true`
- **What it is**: A flag to enable local KV mode
- **Value**: Always `true` (when you want to use local KV)
- **Where it comes from**: You set it yourself

### 2. `UPSTASH_REDIS_REST_URL=http://localhost:8080`
- **What it is**: The URL where your local REST API proxy runs
- **Value**: `http://localhost:8080` (from `docker-compose.yml` line 25)
- **Where it comes from**:
  - Defined in `docker-compose.yml` (proxy runs on port 8080)
  - You just copy this value to `.env.local`

### 3. `UPSTASH_REDIS_REST_TOKEN=local-dev-token`
- **What it is**: A token for authentication (required by @upstash/redis client)
- **Value**: **Any string you want** (e.g., `local-dev-token`, `my-secret-token`, `test123`)
- **Where it comes from**: You make it up! The local proxy doesn't validate it.
- **Note**: In production, Vercel provides a real token. For local dev, any value works.

## Step-by-Step Setup

### Step 1: Create/Edit `.env.local`

Create or edit `.env.local` in your project root:

```bash
# If file doesn't exist, create it
touch .env.local
```

### Step 2: Add These Lines

Open `.env.local` and add:

```bash
# Enable local KV mode
USE_LOCAL_KV=true

# Point to local REST API proxy (from docker-compose.yml)
UPSTASH_REDIS_REST_URL=http://localhost:8080

# Any token value (local proxy doesn't validate it)
UPSTASH_REDIS_REST_TOKEN=local-dev-token
```

### Step 3: Verify Docker Services Are Running

The proxy must be running on port 8080:

```bash
# Start services
npm run redis:start

# Check status
npm run redis:status

# Should show both redis and redis-proxy running
```

### Step 4: Test Connection

```bash
# Test proxy health
curl http://localhost:8080/health

# Should return: {"status":"ok","redis":"connected"}
```

## Complete `.env.local` Example

Here's a complete example of what your `.env.local` might look like:

```bash
# Application Environment
NODE_ENV=development
ENVIRONMENT=DEV

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3004

# Local KV Configuration
USE_LOCAL_KV=true
UPSTASH_REDIS_REST_URL=http://localhost:8080
UPSTASH_REDIS_REST_TOKEN=local-dev-token
```

## Why These Specific Values?

### `http://localhost:8080`
- This matches the port in `docker-compose.yml` (line 25: `"8080:8080"`)
- The proxy service exposes port 8080 to your host machine
- If you change the port in docker-compose.yml, update this URL too

### `local-dev-token` (or any value)
- The `@upstash/redis` client requires a token
- In production, Vercel provides a real token from Upstash
- For local dev, our proxy doesn't validate the token, so any string works
- You can use: `local-dev-token`, `test`, `my-token`, `12345`, etc.

## Troubleshooting

### "Connection refused" or "Cannot connect"

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Check services are started:**
   ```bash
   npm run redis:status
   ```

3. **Check proxy is accessible:**
   ```bash
   curl http://localhost:8080/health
   ```

4. **Verify `.env.local` exists and has correct values:**
   ```bash
   cat .env.local
   ```

### Port 8080 Already in Use

If port 8080 is already used by another service:

1. **Change port in docker-compose.yml:**
   ```yaml
   redis-proxy:
     ports:
       - "8081:8080"  # Use 8081 instead
   ```

2. **Update `.env.local`:**
   ```bash
   UPSTASH_REDIS_REST_URL=http://localhost:8081
   ```

## Summary

- **You don't retrieve these values** - you configure them
- **URL comes from docker-compose.yml** (port 8080)
- **Token can be any string** for local development
- **Just copy the values above** into your `.env.local` file

That's it! No API keys to generate, no tokens to fetch - just configuration values you set.

