import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parsePeople, Person } from '@/lib/types'

/**
 * GET /api/people
 * Get all people from global list
 */
export async function GET() {
  try {
    const people = await pmRepository.readGlobalPeople()
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
