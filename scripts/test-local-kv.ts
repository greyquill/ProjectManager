#!/usr/bin/env node
/**
 * Test Local KV Connection
 *
 * Tests the local Redis + REST API proxy setup
 *
 * Usage: tsx scripts/test-local-kv.ts
 */

import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
const projectRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })

async function testLocalKV() {
  console.log('🧪 Testing Local KV Setup\n')

  // Step 1: Check environment variables
  console.log('1️⃣ Checking environment variables...')
  const useLocalKV = process.env.USE_LOCAL_KV === 'true'
  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!useLocalKV) {
    console.log('   ❌ USE_LOCAL_KV is not set to "true"')
    console.log('   💡 Add to .env.local: USE_LOCAL_KV=true')
    return false
  }
  console.log('   ✅ USE_LOCAL_KV=true')

  if (!restUrl) {
    console.log('   ❌ UPSTASH_REDIS_REST_URL is not set')
    console.log('   💡 Add to .env.local: UPSTASH_REDIS_REST_URL=http://localhost:8080')
    return false
  }
  console.log(`   ✅ UPSTASH_REDIS_REST_URL=${restUrl}`)

  if (!restToken) {
    console.log('   ❌ UPSTASH_REDIS_REST_TOKEN is not set')
    console.log('   💡 Add to .env.local: UPSTASH_REDIS_REST_TOKEN=local-dev-token')
    return false
  }
  console.log(`   ✅ UPSTASH_REDIS_REST_TOKEN is set (${restToken.substring(0, 10)}...)`)

  // Step 2: Test proxy health endpoint
  console.log('\n2️⃣ Testing REST API proxy...')
  try {
    const healthUrl = restUrl.replace(/\/$/, '') + '/health'
    const response = await fetch(healthUrl)

    if (!response.ok) {
      console.log(`   ❌ Proxy health check failed: ${response.status} ${response.statusText}`)
      console.log('   💡 Make sure Redis services are running: npm run redis:start')
      return false
    }

    const health = await response.json()
    if (health.status === 'ok' && health.redis === 'connected') {
      console.log('   ✅ Proxy is healthy and connected to Redis')
    } else {
      console.log(`   ⚠️  Proxy responded but status: ${JSON.stringify(health)}`)
    }
  } catch (error: any) {
    console.log(`   ❌ Cannot connect to proxy: ${error.message}`)
    console.log('   💡 Make sure Redis services are running: npm run redis:start')
    console.log(`   💡 Check proxy is accessible at: ${restUrl}`)
    return false
  }

  // Step 3: Test Upstash Redis client
  console.log('\n3️⃣ Testing @upstash/redis client...')
  try {
    const { Redis } = await import('@upstash/redis')
    const redis = Redis.fromEnv()

    // Test PING
    const pingResult = await redis.ping()
    if (pingResult === 'PONG') {
      console.log('   ✅ Redis PING successful')
    } else {
      console.log(`   ⚠️  Unexpected PING response: ${pingResult}`)
    }

    // Test SET/GET
    const testKey = 'test:local-kv:connection'
    const testValue = `test-${Date.now()}`

    await redis.set(testKey, testValue)
    console.log('   ✅ SET operation successful')

    const getValue = await redis.get(testKey)
    if (getValue === testValue) {
      console.log('   ✅ GET operation successful')
    } else {
      console.log(`   ❌ GET returned wrong value: expected "${testValue}", got "${getValue}"`)
      return false
    }

    // Cleanup
    await redis.del(testKey)
    console.log('   ✅ DELETE operation successful')

  } catch (error: any) {
    console.log(`   ❌ Upstash Redis client error: ${error.message}`)
    console.log('   💡 Check that proxy is running and accessible')
    return false
  }

  // Step 4: Test repository layer
  console.log('\n4️⃣ Testing repository layer...')
  try {
    const pmRepositoryKV = (await import('../src/lib/pm-repository-kv.js')).pmRepositoryKV

    // Test reading projects list (should work even if empty)
    const projects = await pmRepositoryKV.listProjects()
    console.log(`   ✅ Repository layer working (found ${projects.length} projects)`)

  } catch (error: any) {
    console.log(`   ❌ Repository layer error: ${error.message}`)
    return false
  }

  console.log('\n✅ All tests passed! Local KV is working correctly.\n')
  return true
}

// Run tests
testLocalKV()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error)
    process.exit(1)
  })

