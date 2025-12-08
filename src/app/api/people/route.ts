import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parsePeople, Person } from '@/lib/types'

/**
 * GET /api/people
 * Get all people from all projects
 */
export async function GET() {
  try {
    const allPeople = await pmRepository.getAllPeople()
    return NextResponse.json({
      success: true,
      data: allPeople,
    })
  } catch (error) {
    console.error('Error getting all people:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get people',
      },
      { status: 500 }
    )
  }
}

