import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parseEpic, generateTimestamp } from '@/lib/types'

/**
 * PUT /api/projects/[projectName]/epics/[epicName]/reorder-stories
 * Reorder stories within an epic
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectName: string; epicName: string } }
) {
  try {
    const { projectName, epicName } = params
    const body = await request.json()
    const { storyIds } = body

    if (!Array.isArray(storyIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'storyIds must be an array',
        },
        { status: 400 }
      )
    }

    // Verify epic exists
    if (!(await pmRepository.epicExists(projectName, epicName))) {
      return NextResponse.json(
        {
          success: false,
          error: `Epic "${epicName}" not found in project "${projectName}"`,
        },
        { status: 404 }
      )
    }

    // Read current epic
    const epic = await pmRepository.readEpic(projectName, epicName)

    // Get actual stories list (source of truth)
    const actualStories = await pmRepository.listStories(projectName, epicName)
    const actualStoryIdsSet = new Set(actualStories)

    console.log('[Reorder Stories] Debug info:', {
      projectName,
      epicName,
      requestedStoryIds: storyIds,
      epicStoryIds: epic.storyIds || [],
      actualStoriesList: actualStories,
    })

    // Check for invalid story IDs (stories that don't exist)
    const invalidIds = storyIds.filter((id: string) => !actualStoryIdsSet.has(id))

    if (invalidIds.length > 0) {
      console.error('[Reorder Stories] Invalid story IDs:', invalidIds)
      return NextResponse.json(
        {
          success: false,
          error: `Invalid story IDs (stories don't exist): ${invalidIds.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Use actual stories list as source of truth
    // Include all stories that exist but aren't in the new order, append them
    const newStoryIdsSet = new Set(storyIds)
    const missingIds = actualStories.filter((id: string) => !newStoryIdsSet.has(id))

    // If there are missing IDs, append them to maintain all stories
    const finalStoryIds = missingIds.length > 0
      ? [...storyIds, ...missingIds]
      : storyIds

    console.log('[Reorder Stories] Final story IDs:', finalStoryIds)

    // Update epic with new story order
    const updatedEpic = {
      ...epic,
      storyIds: finalStoryIds,
      updatedAt: generateTimestamp(),
    }

    await pmRepository.writeEpic(projectName, epicName, updatedEpic)

    return NextResponse.json({
      success: true,
      data: updatedEpic,
    })
  } catch (error) {
    console.error('Error reordering stories:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder stories',
      },
      { status: 500 }
    )
  }
}


