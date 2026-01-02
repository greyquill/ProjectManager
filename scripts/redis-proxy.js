#!/usr/bin/env node
/**
 * Redis REST API Proxy
 *
 * Translates Upstash Redis REST API format to direct Redis commands.
 * This allows using @upstash/redis client with local Redis.
 *
 * Usage: node scripts/redis-proxy.js
 *
 * Environment Variables:
 * - REDIS_HOST: Redis host (default: localhost)
 * - REDIS_PORT: Redis port (default: 6379)
 * - PROXY_PORT: Proxy server port (default: 8080)
 */

const express = require('express')
const { createClient } = require('redis')

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10)
const PROXY_PORT = parseInt(process.env.PROXY_PORT || '8080', 10)

const app = express()
app.use(express.json())

let redisClient = null

// Initialize Redis client
async function initRedis() {
  try {
    redisClient = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
    })

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    await redisClient.connect()
    console.log(`✅ Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`)
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    process.exit(1)
  }
}

// Translate Upstash REST API format to Redis commands
async function handlePipeline(req, res) {
  try {
    const commands = req.body || []
    const results = []

    for (const cmd of commands) {
      const [operation, ...args] = cmd
      let result

      try {
        switch (operation.toLowerCase()) {
          case 'get':
            result = await redisClient.get(args[0])
            break
          case 'set':
            if (args.length === 2) {
              await redisClient.set(args[0], args[1])
              result = 'OK'
            } else if (args.length > 2) {
              // Handle SET with options (e.g., EX, PX, NX, XX)
              const key = args[0]
              const value = args[1]
              const options = {}
              for (let i = 2; i < args.length; i += 2) {
                const opt = args[i]?.toUpperCase()
                const val = args[i + 1]
                if (opt === 'EX' || opt === 'PX') {
                  options[opt] = val
                } else if (opt === 'NX' || opt === 'XX') {
                  options[opt] = true
                }
              }
              result = await redisClient.set(key, value, options)
            }
            break
          case 'del':
            result = await redisClient.del(args)
            break
          case 'exists':
            result = await redisClient.exists(args[0])
            break
          case 'keys':
            result = await redisClient.keys(args[0])
            break
          case 'mget':
            result = await redisClient.mGet(args)
            break
          case 'mset':
            // MSET takes key-value pairs: [key1, val1, key2, val2, ...]
            const kvPairs = {}
            for (let i = 0; i < args.length; i += 2) {
              kvPairs[args[i]] = args[i + 1]
            }
            result = await redisClient.mSet(kvPairs)
            break
          case 'incr':
            result = await redisClient.incr(args[0])
            break
          case 'decr':
            result = await redisClient.decr(args[0])
            break
          case 'append':
            result = await redisClient.append(args[0], args[1])
            break
          case 'strlen':
            result = await redisClient.strLen(args[0])
            break
          case 'getrange':
            result = await redisClient.getRange(args[0], args[1], args[2])
            break
          case 'setrange':
            result = await redisClient.setRange(args[0], args[1], args[2])
            break
          case 'hget':
            result = await redisClient.hGet(args[0], args[1])
            break
          case 'hset':
            if (args.length === 3) {
              result = await redisClient.hSet(args[0], args[1], args[2])
            } else {
              // HSET with multiple fields
              const obj = {}
              for (let i = 1; i < args.length; i += 2) {
                obj[args[i]] = args[i + 1]
              }
              result = await redisClient.hSet(args[0], obj)
            }
            break
          case 'hgetall':
            result = await redisClient.hGetAll(args[0])
            break
          case 'hdel':
            result = await redisClient.hDel(args[0], args.slice(1))
            break
          case 'hexists':
            result = await redisClient.hExists(args[0], args[1])
            break
          case 'hlen':
            result = await redisClient.hLen(args[0])
            break
          case 'hkeys':
            result = await redisClient.hKeys(args[0])
            break
          case 'hvals':
            result = await redisClient.hVals(args[0])
            break
          case 'lpush':
            result = await redisClient.lPush(args[0], args.slice(1))
            break
          case 'rpush':
            result = await redisClient.rPush(args[0], args.slice(1))
            break
          case 'lpop':
            result = await redisClient.lPop(args[0])
            break
          case 'rpop':
            result = await redisClient.rPop(args[0])
            break
          case 'llen':
            result = await redisClient.lLen(args[0])
            break
          case 'lrange':
            result = await redisClient.lRange(args[0], args[1], args[2])
            break
          case 'sadd':
            result = await redisClient.sAdd(args[0], args.slice(1))
            break
          case 'smembers':
            result = await redisClient.sMembers(args[0])
            break
          case 'srem':
            result = await redisClient.sRem(args[0], args.slice(1))
            break
          case 'scard':
            result = await redisClient.sCard(args[0])
            break
          case 'sismember':
            result = await redisClient.sIsMember(args[0], args[1])
            break
          case 'zadd':
            // ZADD key score member [score member ...]
            const zaddArgs = []
            for (let i = 1; i < args.length; i += 2) {
              zaddArgs.push({ score: parseFloat(args[i]), value: args[i + 1] })
            }
            result = await redisClient.zAdd(args[0], zaddArgs)
            break
          case 'zrange':
            result = await redisClient.zRange(args[0], args[1], args[2])
            break
          case 'zrem':
            result = await redisClient.zRem(args[0], args.slice(1))
            break
          case 'zcard':
            result = await redisClient.zCard(args[0])
            break
          case 'ttl':
            result = await redisClient.ttl(args[0])
            break
          case 'expire':
            result = await redisClient.expire(args[0], args[1])
            break
          case 'persist':
            result = await redisClient.persist(args[0])
            break
          case 'type':
            result = await redisClient.type(args[0])
            break
          case 'ping':
            result = await redisClient.ping()
            break
          default:
            console.warn(`Unsupported operation: ${operation}`)
            result = { error: `Unsupported operation: ${operation}` }
        }

        results.push({ result })
      } catch (error) {
        results.push({ error: error.message })
      }
    }

    res.json(results)
  } catch (error) {
    console.error('Pipeline error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await redisClient.ping()
    res.json({ status: 'ok', redis: 'connected' })
  } catch (error) {
    res.status(500).json({ status: 'error', redis: 'disconnected', error: error.message })
  }
})

// Main pipeline endpoint (Upstash format)
app.post('/pipeline', handlePipeline)

// Also support direct POST for single commands
app.post('/', handlePipeline)

// Start server
async function start() {
  await initRedis()

  app.listen(PROXY_PORT, () => {
    console.log(`🚀 Redis REST API Proxy running on http://localhost:${PROXY_PORT}`)
    console.log(`   Redis: ${REDIS_HOST}:${REDIS_PORT}`)
    console.log(`   Ready to accept Upstash Redis REST API requests`)
  })
}

start().catch(console.error)

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  if (redisClient) {
    await redisClient.quit()
  }
  process.exit(0)
})

