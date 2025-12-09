import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parsePeople, Person } from '@/lib/types'

/**
 * GET /api/people
 * Get all people from global list
 */
export async function GET() {
  try {
    console.log('[People API Direct] ===== Starting /api/people request =====')
    console.log(`[People API Direct] Environment check - VERCEL: ${process.env.VERCEL}, KV_REST_API_URL: ${!!process.env.KV_REST_API_URL}, UPSTASH_REDIS_REST_URL: ${!!process.env.UPSTASH_REDIS_REST_URL}`)
    console.log('[People API Direct] Calling pmRepository.readGlobalPeople()...')
    const people = await pmRepository.readGlobalPeople()
    console.log(`[People API Direct] readGlobalPeople returned:`, {
      length: people.length,
      isArray: Array.isArray(people),
      type: typeof people,
      firstPerson: people[0] || null
    })
    return NextResponse.json({
      success: true,
      data: people,
    })
  } catch (error) {
    console.error('[People API Direct] Error getting all people:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get people',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/people
 * Add a new person to global list
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const people = await pmRepository.readGlobalPeople()

    // Add new person
    people.push(body)

    await pmRepository.writeGlobalPeople(people)

    return NextResponse.json({
      success: true,
      data: body,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add person',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/people
 * Update global people list
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { people } = body

    await pmRepository.writeGlobalPeople(people)

    return NextResponse.json({
      success: true,
      data: people,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update people',
      },
      { status: 500 }
    )
  }
}
