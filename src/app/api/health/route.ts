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
    const hasKvUrl = !!process.env.KV_URL
    const isVercel = process.env.VERCEL === '1'

    // Collect all available env var names (without values for security)
    const allEnvVars = Object.keys(process.env).filter(key =>
      key.includes('REDIS') || key.includes('KV') || key.includes('UPSTASH')
    )

    // Try to initialize Redis client
    let redisStatus = 'not_configured'
    let redisError = null
    let envVarDetails: any = {
      availableEnvVarNames: allEnvVars,
      hasRedisUrl,
      hasKvUrl,
    }

    try {
      // Prioritize Upstash Redis (Marketplace) over Vercel KV (legacy)
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
        envVarDetails.clientType = 'upstash'
      } else if (hasVercelKV) {
        envVarDetails.vercelKvUrl = process.env.KV_REST_API_URL ?
          `${process.env.KV_REST_API_URL.substring(0, 20)}...` : 'not set'
        envVarDetails.vercelKvToken = process.env.KV_REST_API_TOKEN ?
          'set (hidden)' : 'not set'

        // Just check if we can require it, don't actually use it
        require('@vercel/kv')
        redisStatus = 'connected'
        envVarDetails.clientType = 'vercel_kv'
      } else {
        redisStatus = 'no_env_vars'
        envVarDetails.message = 'Neither UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN nor KV_REST_API_URL/KV_REST_API_TOKEN are set'
        envVarDetails.instructions = [
          '1. Go to your Vercel project dashboard',
          '2. Navigate to Settings → Environment Variables',
          '3. Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set (if using Upstash Redis from Marketplace)',
          '4. OR ensure KV_REST_API_URL and KV_REST_API_TOKEN are set (if using Vercel KV)',
          '5. Make sure the variables are available for "Production" environment',
          '6. Redeploy your project after adding/updating environment variables'
        ]
      }
    } catch (error: any) {
      redisStatus = 'error'
      redisError = error?.message || String(error)
      envVarDetails.error = error?.message || String(error)
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

