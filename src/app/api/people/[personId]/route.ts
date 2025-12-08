import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parsePeople, Person } from '@/lib/types'

/**
 * DELETE /api/people/[personId]
 * Delete a person from all projects (with validation)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { personId: string } }
) {
  try {
    const { personId } = params

    // Check if person is used anywhere
    const usage = await pmRepository.checkPersonUsage(personId)

    if (usage.projects.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete person - they are assigned to projects',
          usage: usage,
        },
        { status: 400 }
      )
    }

    // Remove person from all projects' people.json files
    const projectNames = await pmRepository.listProjects()
    for (const projectName of projectNames) {
      try {
        const people = await pmRepository.readPeople(projectName)
        const updatedPeople = people.filter((p) => p.id !== personId)
        if (updatedPeople.length !== people.length) {
          await pmRepository.writePeople(projectName, updatedPeople)
        }
      } catch {
        // Skip projects that can't be read
      }
    }

    return NextResponse.json({
      success: true,
      message: `Person "${personId}" deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting person:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete person',
      },
      { status: 500 }
    )
  }
}

