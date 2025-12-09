import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parseStory, generateTimestamp } from '@/lib/types'

/**
 * POST /api/projects/[projectName]/epics/[epicName]/stories/[storyId]/archive
 * Archive a story
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectName: string; epicName: string; storyId: string } }
) {
  try {
    const { projectName, epicName, storyId } = params

    if (!(await pmRepository.storyExists(projectName, epicName, storyId))) {
      return NextResponse.json(
        {
          success: false,
          error: `Story "${storyId}" not found in epic "${epicName}", project "${projectName}"`,
        },
        { status: 404 }
      )
    }

    // Read the story
    const story = await pmRepository.readStory(projectName, epicName, storyId)

    // Check if already archived
    if (story.archived) {
      return NextResponse.json(
        {
          success: false,
          error: `Story "${storyId}" is already archived`,
        },
        { status: 400 }
      )
    }

    // Update story with archived flag
    const updatedStory = {
      ...story,
      archived: true,
      updatedAt: generateTimestamp(),
    }

    await pmRepository.writeStory(projectName, epicName, storyId, updatedStory)

    return NextResponse.json({
      success: true,
      data: updatedStory,
      message: `Story "${storyId}" archived successfully`,
    })
  } catch (error) {
    console.error('Error archiving story:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to archive story',
      },
      { status: 500 }
    )
  }
}

