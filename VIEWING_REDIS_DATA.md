# Viewing Redis Data

Multiple ways to view and inspect data in your local Redis instance.

## Method 1: Using the View Script (Recommended) ⭐

### View All Data

```bash
npm run view:redis
```

Shows:
- All projects
- All epics per project
- Story counts per epic
- People data
- Summary statistics

### View Keys Only

```bash
npm run view:redis -- --keys-only
```

### View Specific Key

```bash
npm run view:redis -- --key=pm:project:umami-healthcare
```

## Method 2: Using Redis CLI (Direct Access)

### Connect to Redis Container

```bash
docker-compose exec redis redis-cli
```

### Useful Commands

```bash
# List all keys with pm: prefix
KEYS pm:*

# Get a specific key
GET pm:project:umami-healthcare

# Get all keys (be careful with large datasets)
KEYS *

# Count keys
DBSIZE

# Get key type
TYPE pm:project:umami-healthcare

# Check if key exists
EXISTS pm:project:umami-healthcare

# Get all keys matching pattern
KEYS pm:epic:*

# Exit Redis CLI
exit
```

### Example Session

```bash
$ docker-compose exec redis redis-cli

127.0.0.1:6379> KEYS pm:*
1) "pm:project:umami-healthcare"
2) "pm:projects:list"
3) "pm:people:global"
4) "pm:epic:umami-healthcare:revenue-cycle-management"
...

127.0.0.1:6379> GET pm:project:umami-healthcare
{"name":"Umami Healthcare","summary":"..."}

127.0.0.1:6379> exit
```

## Method 3: Using RedisInsight (GUI Tool)

### Install RedisInsight

1. Download from: https://redis.com/redis-enterprise/redis-insight/
2. Or use Docker:

```bash
docker run -d --name redisinsight -p 8001:8001 redis/redisinsight:latest
```

### Connect to Local Redis

1. Open RedisInsight: http://localhost:8001
2. Add Database:
   - **Host**: `localhost` (or `redis` if connecting from Docker network)
   - **Port**: `6379`
   - **Name**: `Local Project Manager`
3. Click "Add Redis Database"

### Features in RedisInsight

- **Browser**: Browse all keys visually
- **CLI**: Execute Redis commands
- **Profiler**: Monitor commands in real-time
- **Slow Log**: View slow queries
- **Memory Analysis**: See memory usage

## Method 4: Using a Simple Node Script

Create a quick script to view data:

```javascript
// quick-view.js
const { Redis } = require('@upstash/redis')
const redis = Redis.fromEnv()

async function view() {
  // Get all projects
  const projects = await redis.get('pm:projects:list')
  console.log('Projects:', projects)

  // Get a specific project
  const project = await redis.get('pm:project:umami-healthcare')
  console.log('Project:', JSON.stringify(project, null, 2))
}

view()
```

Run: `node quick-view.js`

## Method 5: Check via Application

### Health Endpoint

```bash
curl http://localhost:3004/api/health
```

### Check Migration Status

```bash
npm run check:migration
```

## Common Queries

### Count All Keys

```bash
docker-compose exec redis redis-cli DBSIZE
```

### List All Project Keys

```bash
docker-compose exec redis redis-cli KEYS "pm:project:*"
```

### List All Epic Keys

```bash
docker-compose exec redis redis-cli KEYS "pm:epic:*"
```

### List All Story Keys

```bash
docker-compose exec redis redis-cli KEYS "pm:story:*"
```

### Get People Data

```bash
docker-compose exec redis redis-cli GET "pm:people:global"
```

### Get Specific Project

```bash
docker-compose exec redis redis-cli GET "pm:project:umami-healthcare"
```

### Get Specific Epic

```bash
docker-compose exec redis redis-cli GET "pm:epic:umami-healthcare:revenue-cycle-management"
```

### Get Specific Story

```bash
docker-compose exec redis redis-cli GET "pm:story:umami-healthcare:revenue-cycle-management:F-RCM-001"
```

## Key Structure Reference

```
pm:project:[project-name]                    # Project data
pm:epic:[project-name]:[epic-name]           # Epic data
pm:story:[project-name]:[epic-name]:[story-id] # Story data
pm:projects:list                              # Global projects list
pm:people:global                             # Global people data
pm:epic:[project-name]:[epic-name]:stories    # Epic story list
```

## Troubleshooting

### "Connection refused"

**Solution:**
1. Check Redis is running: `npm run redis:status`
2. Start Redis: `npm run redis:start`

### "No keys found"

**Solution:**
1. Run migration: `npm run migrate-to-local-kv`
2. Check migration status: `npm run check:migration`

### "Cannot connect to Redis"

**Solution:**
1. Verify Docker is running: `docker ps`
2. Check Redis logs: `npm run redis:logs`
3. Restart Redis: `npm run redis:restart`

## Quick Reference

```bash
# View all data (formatted)
npm run view:redis

# Connect to Redis CLI
docker-compose exec redis redis-cli

# View specific key
docker-compose exec redis redis-cli GET "pm:project:umami-healthcare"

# Count all keys
docker-compose exec redis redis-cli DBSIZE

# List all keys
docker-compose exec redis redis-cli KEYS "pm:*"
```

