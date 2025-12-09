import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parseEpic } from '@/lib/types'

/**
 * GET /api/projects/[projectName]/epics/[epicName]
 * Get a specific epic
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectName: string; epicName: string } }
) {
  try {
    const { projectName, epicName } = params

    if (!(await pmRepository.epicExists(projectName, epicName))) {
      return NextResponse.json(
        {
          success: false,
          error: `Epic "${epicName}" not found in project "${projectName}"`,
        },
        { status: 404 }
      )
    }

    const epic = await pmRepository.readEpic(projectName, epicName)
    return NextResponse.json({
      success: true,
      data: epic,
    })
  } catch (error) {
    console.error('Error reading epic:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read epic',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[projectName]/epics/[epicName]
 * Update an epic
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectName: string; epicName: string } }
) {
  try {
    const { projectName, epicName } = params
    const body = await request.json()

    if (!(await pmRepository.epicExists(projectName, epicName))) {
      return NextResponse.json(
        {
          success: false,
          error: `Epic "${epicName}" not found in project "${projectName}"`,
        },
        { status: 404 }
      )
    }

    // Validate and update
    const epicData = parseEpic(body)
    await pmRepository.writeEpic(projectName, epicName, epicData)

    return NextResponse.json({
      success: true,
      data: epicData,
    })
  } catch (error) {
    console.error('Error updating epic:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update epic',
      },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/projects/[projectName]/epics/[epicName]
 * Delete an epic
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectName: string; epicName: string } }
) {
  try {
    const { projectName, epicName } = params

    if (!(await pmRepository.epicExists(projectName, epicName))) {
      return NextResponse.json(
        {
          success: false,
          error: `Epic "${epicName}" not found in project "${projectName}"`,
        },
        { status: 404 }
      )
    }

    // Check if epic has active stories - must be empty or all stories moved/deleted before deletion
    const activeStories = await pmRepository.listActiveStories(projectName, epicName)

    if (activeStories.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete epic "${epicName}". It contains ${activeStories.length} active story(ies). Please remove or move all stories before deleting the epic.`,
        },
        { status: 400 }
      )
    }

    await pmRepository.deleteEpic(projectName, epicName)

    return NextResponse.json({
      success: true,
      message: `Epic "${epicName}" deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting epic:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete epic',
      },
      { status: 500 }
    )
  }
}


