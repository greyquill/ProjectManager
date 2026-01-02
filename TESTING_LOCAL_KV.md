# Testing Local KV Setup

## Quick Test (5 Steps)

### Step 1: Start Docker Services

```bash
npm run redis:start
```

**Expected output:**
```
Creating project-manager-redis ... done
Creating project-manager-redis-proxy ... done
```

### Step 2: Verify Services Are Running

```bash
npm run redis:status
```

**Expected output:**
```
NAME                          STATUS
project-manager-redis         Up
project-manager-redis-proxy   Up
```

### Step 3: Check Proxy Health

```bash
curl http://localhost:8080/health
```

**Expected output:**
```json
{"status":"ok","redis":"connected"}
```

### Step 4: Configure Environment

Make sure `.env.local` has:

```bash
USE_LOCAL_KV=true
UPSTASH_REDIS_REST_URL=http://localhost:8080
UPSTASH_REDIS_REST_TOKEN=local-dev-token
```

### Step 5: Run Automated Test

```bash
npm run test:local-kv
```

**Expected output:**
```
🧪 Testing Local KV Setup

1️⃣ Checking environment variables...
   ✅ USE_LOCAL_KV=true
   ✅ UPSTASH_REDIS_REST_URL=http://localhost:8080
   ✅ UPSTASH_REDIS_REST_TOKEN is set (local-dev-...)

2️⃣ Testing REST API proxy...
   ✅ Proxy is healthy and connected to Redis

3️⃣ Testing @upstash/redis client...
   ✅ Redis PING successful
   ✅ SET operation successful
   ✅ GET operation successful
   ✅ DELETE operation successful

4️⃣ Testing repository layer...
   ✅ Repository layer working (found 0 projects)

✅ All tests passed! Local KV is working correctly.
```

## Manual Testing

### Test 1: Proxy Health Check

```bash
curl http://localhost:8080/health
```

Should return: `{"status":"ok","redis":"connected"}`

### Test 2: Test from Node.js

```bash
node -e "
const { Redis } = require('@upstash/redis');
const redis = Redis.fromEnv();
redis.ping().then(r => console.log('PING:', r));
"
```

Should output: `PING: PONG`

### Test 3: Test from Application

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Visit health endpoint:
   ```
   http://localhost:3004/api/health
   ```

3. Check the response - should show KV connection status

### Test 4: Test Repository Operations

Create a test script or use the app UI to:
- Create a project
- Create an epic
- Create a story
- Verify data persists

## Troubleshooting

### ❌ "Cannot connect to Docker daemon"

**Solution:**
1. Open Docker Desktop
2. Wait for it to start
3. Try again: `npm run redis:start`

### ❌ "Connection refused" on port 8080

**Solution:**
1. Check services are running: `npm run redis:status`
2. Check logs: `npm run redis:logs`
3. Restart services: `npm run redis:restart`

### ❌ "UPSTASH_REDIS_REST_URL is not set"

**Solution:**
1. Create `.env.local` if it doesn't exist
2. Add: `UPSTASH_REDIS_REST_URL=http://localhost:8080`
3. Restart dev server

### ❌ "Proxy health check failed"

**Solution:**
1. Check proxy container is running: `docker ps`
2. Check proxy logs: `docker logs project-manager-redis-proxy`
3. Verify Redis is connected: `docker logs project-manager-redis`

### ❌ "Upstash Redis client error"

**Possible causes:**
1. Proxy not running
2. Wrong URL in `.env.local`
3. Network issues

**Solution:**
1. Verify proxy: `curl http://localhost:8080/health`
2. Check `.env.local` has correct URL
3. Restart services: `npm run redis:restart`

## Next Steps After Testing

Once tests pass:

1. ✅ **Phase 1 Complete** - Local KV infrastructure working
2. ⏭️ **Proceed to Phase 2** - Create migration tool
3. ⏭️ **Proceed to Phase 3** - Migrate data from `/pm` to KV

## Quick Reference

```bash
# Start services
npm run redis:start

# Check status
npm run redis:status

# Test connection
npm run test:local-kv

# View logs
npm run redis:logs

# Stop services
npm run redis:stop
```

