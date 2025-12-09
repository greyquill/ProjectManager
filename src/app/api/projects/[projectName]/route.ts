import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parseProject } from '@/lib/types'

/**
 * GET /api/projects/[projectName]
 * Get a specific project
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

    const project = await pmRepository.readProject(projectName)
    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('Error reading project:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to read project',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[projectName]
 * Update a project
 */
export async function PUT(
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
    const projectData = parseProject(body)
    await pmRepository.writeProject(projectName, projectData)

    return NextResponse.json({
      success: true,
      data: projectData,
    })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update project',
      },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/projects/[projectName]
 * Delete a project
 */
export async function DELETE(
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

    await pmRepository.deleteProject(projectName)

    return NextResponse.json({
      success: true,
      message: `Project "${projectName}" deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete project',
      },
      { status: 500 }
    )
  }
}


