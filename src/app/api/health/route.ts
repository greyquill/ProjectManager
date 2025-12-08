import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * Health check endpoint to verify Redis connection
 */
export async function GET() {
  try {
    // Check environment variables
    const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    const hasVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
    const hasRedisUrl = !!process.env.REDIS_URL
    const isVercel = process.env.VERCEL === '1'

    // Try to initialize Redis client
    let redisStatus = 'not_configured'
    let redisError = null
    let envVarDetails: any = {}

    try {
      if (hasUpstash) {
        envVarDetails.upstashUrl = process.env.UPSTASH_REDIS_REST_URL ?
          `${process.env.UPSTASH_REDIS_REST_URL.substring(0, 20)}...` : 'not set'
        envVarDetails.upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN ?
          'set (hidden)' : 'not set'

        // Validate URL format first
        const url = process.env.UPSTASH_REDIS_REST_URL
        if (url) {
          try {
            new URL(url)
          } catch {
            throw new Error(`Invalid URL format: ${url}`)
          }
        }

        const { Redis } = require('@upstash/redis')
        const client = Redis.fromEnv()
        // Try a simple ping
        await client.ping()
        redisStatus = 'connected'
      } else if (hasVercelKV) {
        const { kv } = require('@vercel/kv')
        redisStatus = 'connected'
      } else {
        redisStatus = 'no_env_vars'
      }
    } catch (error: any) {
      redisStatus = 'error'
      redisError = error?.message || String(error)
    }

    return NextResponse.json({
      success: true,
      environment: {
        isVercel,
        hasUpstashEnv: hasUpstash,
        hasVercelKVEnv: hasVercelKV,
        redisStatus,
        redisError,
        envVarDetails,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    )
  }
}

