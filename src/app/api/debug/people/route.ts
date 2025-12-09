import { NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'

/**
 * GET /api/debug/people
 * Debug endpoint to test people reading
 */
export async function GET() {
  try {
    console.log('[Debug] Starting people read test')
    const people = await pmRepository.readGlobalPeople()
    console.log(`[Debug] Read ${people.length} people`)

    return NextResponse.json({
      success: true,
      count: people.length,
      people: people.map(p => ({ id: p.id, name: p.name, email: p.email })),
      message: `Successfully read ${people.length} people from global list`
    })
  } catch (error) {
    console.error('[Debug] Error reading people:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read people',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

