import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parseProject, createProject } from '@/lib/types'

/**
 * GET /api/projects
 * List all projects
 */
export async function GET() {
  try {
    const projectNames = await pmRepository.listProjects()
    const projects = await Promise.all(
      projectNames.map(async (name) => {
        try {
          return await pmRepository.readProject(name)
        } catch {
          // Skip projects that can't be read
          return null
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: projects.filter((p) => p !== null),
    })
  } catch (error) {
    console.error('Error listing projects:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list projects',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const projectName = body.name
      ?.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    if (!projectName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project name is required',
        },
        { status: 400 }
      )
    }

    // Check if project already exists
    if (await pmRepository.projectExists(projectName)) {
      return NextResponse.json(
        {
          success: false,
          error: `Project "${projectName}" already exists`,
        },
        { status: 409 }
      )
    }

    // Validate and create project
    const projectData = parseProject(body)
    const project = createProject(projectData)

    await pmRepository.writeProject(projectName, project)

    return NextResponse.json(
      {
        success: true,
        data: { ...project, name: projectName },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create project',
      },
      { status: 400 }
    )
  }
}

