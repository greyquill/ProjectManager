import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parseStory, generateTimestamp } from '@/lib/types'

/**
 * PUT /api/projects/[projectName]/epics/[epicName]/move-story
 * Move a story from one epic to another
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectName: string; epicName: string } }
) {
  try {
    const { projectName, epicName } = params
    const body = await request.json()
    const { storyId, targetEpicName, targetPosition } = body

    if (!storyId || !targetEpicName) {
      return NextResponse.json(
        {
          success: false,
          error: 'storyId and targetEpicName are required',
        },
        { status: 400 }
      )
    }

    // Verify source epic exists
    if (!(await pmRepository.epicExists(projectName, epicName))) {
      return NextResponse.json(
        {
          success: false,
          error: `Source epic "${epicName}" not found`,
        },
        { status: 404 }
      )
    }

    // Verify target epic exists
    if (!(await pmRepository.epicExists(projectName, targetEpicName))) {
      return NextResponse.json(
        {
          success: false,
          error: `Target epic "${targetEpicName}" not found`,
        },
        { status: 404 }
      )
    }

    // Verify story exists in source epic
    if (!(await pmRepository.storyExists(projectName, epicName, storyId))) {
      return NextResponse.json(
        {
          success: false,
          error: `Story "${storyId}" not found in epic "${epicName}"`,
        },
        { status: 404 }
      )
    }

    // Read source and target epics
    const sourceEpic = await pmRepository.readEpic(projectName, epicName)
    const targetEpic = await pmRepository.readEpic(projectName, targetEpicName)

    // Read the story
    const story = await pmRepository.readStory(projectName, epicName, storyId)

    // Remove story from source epic's storyIds
    const sourceStoryIds = (sourceEpic.storyIds || []).filter((id: string) => id !== storyId)
    const updatedSourceEpic = {
      ...sourceEpic,
      storyIds: sourceStoryIds,
      updatedAt: generateTimestamp(),
    }

    // Add story to target epic's storyIds at specified position
    const targetStoryIds = [...(targetEpic.storyIds || [])]
    const insertPosition = targetPosition !== undefined && targetPosition >= 0 && targetPosition <= targetStoryIds.length
      ? targetPosition
      : targetStoryIds.length // Default to end if position is invalid

    targetStoryIds.splice(insertPosition, 0, storyId)
    const updatedTargetEpic = {
      ...targetEpic,
      storyIds: targetStoryIds,
      updatedAt: generateTimestamp(),
    }

    // Update story's epicId to point to the new parent epic
    const updatedStory = {
      ...story,
      epicId: targetEpicName, // Update parent reference
      updatedAt: generateTimestamp(),
    }

    // Write all updates
    await pmRepository.writeEpic(projectName, epicName, updatedSourceEpic)
    await pmRepository.writeEpic(projectName, targetEpicName, updatedTargetEpic)
    await pmRepository.writeStory(projectName, targetEpicName, storyId, updatedStory)

    return NextResponse.json({
      success: true,
      data: {
        story: updatedStory,
        sourceEpic: updatedSourceEpic,
        targetEpic: updatedTargetEpic,
      },
    })
  } catch (error) {
    console.error('Error moving story:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to move story',
      },
      { status: 500 }
    )
  }
}

