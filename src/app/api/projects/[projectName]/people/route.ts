import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parsePeople } from '@/lib/types'

/**
 * GET /api/projects/[projectName]/people
 * Get all people for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    const { projectName } = params

    if (!(await pmRepository.projectExists(projectName))) {
      return NextResponse.json(
        {
          success: false,
          error: `Project "${projectName}" not found`,
        },
        { status: 404 }
      )
    }

    const people = await pmRepository.readPeople(projectName)
    return NextResponse.json({
      success: true,
      data: people,
    })
  } catch (error) {
    console.error('Error reading people:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read people',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectName]/people
 * Create or update people for a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    const { projectName } = params
    const body = await request.json()

    if (!(await pmRepository.projectExists(projectName))) {
      return NextResponse.json(
        {
          success: false,
          error: `Project "${projectName}" not found`,
        },
        { status: 404 }
      )
    }

    // Validate and update
    const peopleData = parsePeople(body)
    await pmRepository.writePeople(projectName, peopleData)

    return NextResponse.json({
      success: true,
      data: peopleData,
    })
  } catch (error) {
    console.error('Error writing people:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to write people',
      },
      { status: 400 }
    )
  }
}

