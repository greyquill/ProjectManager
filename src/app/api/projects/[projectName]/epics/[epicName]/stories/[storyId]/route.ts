import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { parseStory } from '@/lib/types'

/**
 * GET /api/projects/[projectName]/epics/[epicName]/stories/[storyId]
 * Get a specific story
 */
export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: { projectName: string; epicName: string; storyId: string } }
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

    const story = await pmRepository.readStory(projectName, epicName, storyId)
    return NextResponse.json({
      success: true,
      data: story,
    })
  } catch (error) {
    console.error('Error reading story:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read story',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[projectName]/epics/[epicName]/stories/[storyId]
 * Update a story
 */
export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: { projectName: string; epicName: string; storyId: string } }
) {
  try {
    const { projectName, epicName, storyId } = params
    const body = await request.json()

    if (!(await pmRepository.storyExists(projectName, epicName, storyId))) {
      return NextResponse.json(
        {
          success: false,
          error: `Story "${storyId}" not found in epic "${epicName}", project "${projectName}"`,
        },
        { status: 404 }
      )
    }

    // Validate and update
    const storyData = parseStory(body)
    await pmRepository.writeStory(projectName, epicName, storyId, storyData)

    return NextResponse.json({
      success: true,
      data: storyData,
    })
  } catch (error) {
    console.error('Error updating story:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update story',
      },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/projects/[projectName]/epics/[epicName]/stories/[storyId]
 * Delete a story
 */
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: { projectName: string; epicName: string; storyId: string } }
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

    await pmRepository.deleteStory(projectName, epicName, storyId)

    return NextResponse.json({
      success: true,
      message: `Story "${storyId}" deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting story:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete story',
      },
      { status: 500 }
    )
  }
}

