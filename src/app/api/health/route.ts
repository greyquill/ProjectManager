import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * Health check endpoint to verify Redis connection
 */
export async function GET() {
  try {
    // Check environment variables
    const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL
    const hasVercelKV = !!process.env.KV_REST_API_URL
    const isVercel = process.env.VERCEL === '1'

    // Try to initialize Redis client
    let redisStatus = 'not_configured'
    let redisError = null

    try {
      if (hasUpstash) {
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

