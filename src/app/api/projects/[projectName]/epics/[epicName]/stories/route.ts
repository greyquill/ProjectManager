import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'

/**
 * GET /api/projects/[projectName]/epics/[epicName]/stories
 * List all stories for an epic
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

    // Get the epic to access its storyIds array (source of truth for order)
    const epic = await pmRepository.readEpic(projectName, epicName)
    const orderedStoryIds = epic.storyIds || []

    // Get all stories (may include stories not yet in epic.storyIds)
    const allStoryIds = await pmRepository.listStories(projectName, epicName)

    // Merge: use epic.storyIds order, then append any stories not in the array
    const storyIdsSet = new Set(orderedStoryIds)
    const missingStoryIds = allStoryIds.filter((id: string) => !storyIdsSet.has(id))
    const finalStoryIds = [...orderedStoryIds, ...missingStoryIds]

    const stories = await Promise.all(
      finalStoryIds.map(async (id) => {
        try {
          return await pmRepository.readStory(projectName, epicName, id)
        } catch {
          return null
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: stories.filter((s) => s !== null),
    })
  } catch (error) {
    console.error('Error listing stories:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to list stories',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectName]/epics/[epicName]/stories
 * Create a new story
 */
export async function POST(
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

    const story = await pmRepository.createStory(projectName, epicName, body)

    return NextResponse.json(
      {
        success: true,
        data: story,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating story:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create story',
      },
      { status: 400 }
    )
  }
}


