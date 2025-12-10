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
    // First, remove any existing duplicate of this storyId (in case it was already there)
    const targetStoryIds = [...(targetEpic.storyIds || [])].filter((id: string) => id !== storyId)
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

    // Delete the old story file from source epic (for file system)
    // For KV, we also need to remove from source epic's stories list
    if (epicName !== targetEpicName) {
      try {
        const { getKVRepository } = await import('@/lib/pm-repository')
        const kvRepo = await getKVRepository()

        if (kvRepo) {
          // For KV: Remove from source epic's stories list
          const kv = await import('@vercel/kv').then(m => m.kv).catch(() => null)
          if (kv) {
            try {
              const sourceStoriesListKey = `pm:${projectName}:${epicName}:stories`
              const storiesList = await kv.get(sourceStoriesListKey) || []
              const updatedList = Array.isArray(storiesList)
                ? storiesList.filter((id: string) => id !== storyId)
                : []
              await kv.set(sourceStoriesListKey, updatedList)
            } catch (kvErr) {
              console.warn(`Could not update source epic's stories list in KV:`, kvErr)
            }
          }
        } else {
          // For file system: Delete the old story file
          const path = require('path')
          const fs = require('fs').promises
          const oldStoryPath = path.join(
            process.cwd(),
            'pm',
            projectName,
            epicName,
            `${storyId}.json`
          )
          try {
            await fs.unlink(oldStoryPath)
            console.log(`Deleted old story file: ${oldStoryPath}`)
          } catch (fileErr: any) {
            // File might not exist, that's okay
            if (fileErr.code !== 'ENOENT') {
              console.warn(`Could not delete old story file ${oldStoryPath}:`, fileErr)
            }
          }
        }
      } catch (err) {
        // If we can't clean up, log warning but don't fail
        console.warn(`Could not clean up old story location:`, err)
      }
    }

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

