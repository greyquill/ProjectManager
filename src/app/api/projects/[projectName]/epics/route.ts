import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parseEpic, createEpic } from '@/lib/types'

/**
 * GET /api/projects/[projectName]/epics
 * List all epics for a project
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

    const epicNames = await pmRepository.listEpics(projectName)
    const epics = await Promise.all(
      epicNames.map(async (name) => {
        try {
          const epic = await pmRepository.readEpic(projectName, name)
          // Include the folder name (epic identifier) in the response
          return { ...epic, _name: name }
        } catch {
          return null
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: epics.filter((e) => e !== null),
    })
  } catch (error) {
    console.error('Error listing epics:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list epics',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectName]/epics
 * Create a new epic
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

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Epic title is required',
        },
        { status: 400 }
      )
    }

    // Generate next sequential epic ID (EPIC-0001, EPIC-0002, etc.)
    const epicId = await pmRepository.generateNextEpicId(projectName)

    // Validate and create epic
    const epicData = parseEpic(body)
    const epic = createEpic({ ...epicData, id: epicId })

    await pmRepository.writeEpic(projectName, epicId, epic)

    return NextResponse.json(
      {
        success: true,
        data: { name: epicId, ...epic },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating epic:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create epic',
      },
      { status: 400 }
    )
  }
}

