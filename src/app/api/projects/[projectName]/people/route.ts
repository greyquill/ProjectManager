import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'

/**
 * GET /api/projects/[projectName]/people
 * Get all people (global list), optionally filtered by project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    const { projectName } = params

    // Read global people list - use EXACT same code as /api/people which works
    console.log(`[People API Project] ===== Starting request for project ${projectName} =====`)

    // Use the exact same pattern as the working /api/people endpoint
    const allPeople = await pmRepository.readGlobalPeople()
    console.log(`[People API Project] readGlobalPeople returned ${allPeople.length} people`)

    // Log for debugging
    console.log(`[People API Project] Final result: ${allPeople.length} people for project ${projectName}`)

    // Optionally filter by project if query param is set
    const { searchParams } = new URL(request.url)
    const filterByProject = searchParams.get('filterByProject') === 'true'

    if (filterByProject) {
      try {
        // Get project to see who is assigned
        const project = await pmRepository.readProject(projectName)
        const projectPeopleIds = new Set([
          project.metadata?.manager,
          ...(project.metadata?.contributors || []),
        ].filter(id => id && id !== 'unassigned'))

        const filteredPeople = allPeople.filter(person => projectPeopleIds.has(person.id))
        return NextResponse.json({
          success: true,
          data: filteredPeople,
        })
      } catch (projectError) {
        // If project doesn't exist, still return all people
        console.warn(`[People API] Could not read project ${projectName}, returning all people:`, projectError)
        return NextResponse.json({
          success: true,
          data: allPeople,
        })
      }
    }

    // Return all people
    return NextResponse.json({
      success: true,
      data: allPeople,
    })
  } catch (error) {
    console.error('[People API] Error reading people:', error)
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
 * PUT /api/projects/[projectName]/people
 * Update global people list (deprecated endpoint for backward compatibility)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    const body = await request.json()
    const { people } = body

    // Write to global people file instead
    await pmRepository.writeGlobalPeople(people)

    return NextResponse.json({
      success: true,
      data: people,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write people',
      },
      { status: 500 }
    )
  }
}
