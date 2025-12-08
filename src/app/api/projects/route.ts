import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parseProject, createProject } from '@/lib/types'

/**
 * GET /api/projects
 * List all projects
 */
export async function GET() {
  try {
    let projectNames = await pmRepository.listProjects()

    // If list is empty, try to discover projects by checking common project names
    // This is a fallback in case the list wasn't properly maintained
    if (projectNames.length === 0) {
      // Try to read known project names that might exist
      // Common project names to check (this is a temporary workaround)
      const commonNames = ['umami-healthcare', 'healthcare-platform']
      const discoveredProjects: string[] = []

      for (const name of commonNames) {
        try {
          if (await pmRepository.projectExists(name)) {
            discoveredProjects.push(name)
            // Add to list for future
            try {
              const project = await pmRepository.readProject(name)
              await pmRepository.writeProject(name, project) // This will update the list
            } catch {
              // Skip if can't read
            }
          }
        } catch {
          // Skip if check fails
        }
      }

      if (discoveredProjects.length > 0) {
        projectNames = discoveredProjects
      }
    }

    const projects = await Promise.all(
      projectNames.map(async (name) => {
        try {
          const project = await pmRepository.readProject(name)
          // Include the project name (folder name) in the response
          return { ...project, _name: name }
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

