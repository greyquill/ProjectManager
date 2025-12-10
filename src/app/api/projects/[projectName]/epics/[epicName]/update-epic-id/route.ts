import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'
import { generateTimestamp } from '@/lib/types'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * PUT /api/projects/[projectName]/epics/[epicName]/update-epic-id
 * Update the Epic ID (acronym) used in story IDs
 * This will update all stories under the epic to use the new acronym
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectName: string; epicName: string } }
) {
  try {
    const { projectName, epicName } = params
    const body = await request.json()
    const { oldEpicId, newEpicId } = body

    if (!oldEpicId || !newEpicId) {
      return NextResponse.json(
        {
          success: false,
          error: 'oldEpicId and newEpicId are required',
        },
        { status: 400 }
      )
    }

    // Validate newEpicId format (2-6 uppercase letters)
    if (!/^[A-Z]{2,6}$/.test(newEpicId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'newEpicId must be 2-6 uppercase letters',
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

    // Read the epic
    const epic = await pmRepository.readEpic(projectName, epicName)

    // Get all stories in this epic (use epic.storyIds as source of truth)
    const storyIds = epic.storyIds || []

    if (storyIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Epic has no stories to update',
        },
        { status: 400 }
      )
    }

    // Create ID mapping: oldId -> newId
    const idMapping = new Map<string, string>()
    const newStoryIds: string[] = []

    // Process each story
    for (const oldStoryId of storyIds) {
      // Parse the old story ID to extract the number
      const oldMatch = oldStoryId.match(/^(F|NFR)-([A-Z]{2,6})-(\d{3})$/)
      if (!oldMatch) {
        console.warn(`Skipping story ${oldStoryId} - invalid format`)
        continue
      }

      const prefix = oldMatch[1] // F or NFR
      const oldAcronym = oldMatch[2]
      const storyNumber = oldMatch[3]

      // Verify the old acronym matches
      if (oldAcronym !== oldEpicId) {
        console.warn(`Story ${oldStoryId} has different acronym ${oldAcronym}, expected ${oldEpicId}`)
        continue
      }

      // Generate new story ID
      const newStoryId = `${prefix}-${newEpicId}-${storyNumber}`
      idMapping.set(oldStoryId, newStoryId)
    }

    // Read all stories and update them
    const updatedStories: Array<{ oldId: string; newId: string; story: any }> = []

    for (const [oldId, newId] of idMapping) {
      try {
        const story = await pmRepository.readStory(projectName, epicName, oldId)

        // Update story ID
        const updatedStory = {
          ...story,
          id: newId,
          updatedAt: generateTimestamp(),
        }

        // Update relatedStories references
        if (updatedStory.relatedStories && Array.isArray(updatedStory.relatedStories)) {
          updatedStory.relatedStories = updatedStory.relatedStories.map((relatedId: string) => {
            return idMapping.get(relatedId) || relatedId
          })
        }

        // Write the story with new ID
        await pmRepository.writeStory(projectName, epicName, newId, updatedStory)

        // Delete old story file if IDs are different
        // For file system, delete the old file directly
        // For KV, the old key will be overwritten/ignored
        if (oldId !== newId) {
          try {
            // Try soft delete first (marks as deleted)
            const oldStory = await pmRepository.readStory(projectName, epicName, oldId)
            if (!oldStory.deleted) {
              // Mark as deleted first
              const deletedStory = {
                ...oldStory,
                deleted: true,
                updatedAt: generateTimestamp(),
              }
              await pmRepository.writeStory(projectName, epicName, oldId, deletedStory)
            }

            // For file system, also try to delete the physical file
            // Check if we're using file system (not KV)
            const PM_DATA_DIR = path.join(process.cwd(), 'pm')
            const oldFilePath = path.join(PM_DATA_DIR, projectName, epicName, `${oldId}.json`)
            try {
              await fs.unlink(oldFilePath)
            } catch (fileErr) {
              // File might not exist or already deleted, that's okay
              console.warn(`Could not delete old story file ${oldFilePath}:`, fileErr)
            }
          } catch (err) {
            // If delete fails, try to continue - the old file might not exist
            console.warn(`Could not delete old story ${oldId}:`, err)
          }
        }

        updatedStories.push({ oldId, newId, story: updatedStory })

        // Add to new storyIds array if not deleted
        if (!updatedStory.deleted) {
          newStoryIds.push(newId)
        }
      } catch (err) {
        console.error(`Error updating story ${oldId}:`, err)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to update story ${oldId}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          },
          { status: 500 }
        )
      }
    }

    // Update epic's storyIds array
    const updatedEpic = {
      ...epic,
      storyIds: newStoryIds,
      updatedAt: generateTimestamp(),
    }
    await pmRepository.writeEpic(projectName, epicName, updatedEpic)

    // Update relatedStories in all other stories across the project
    // Get all epics in the project
    const allEpics = await pmRepository.listEpics(projectName)

    for (const otherEpicName of allEpics) {
      if (otherEpicName === epicName) continue // Skip the current epic

      const otherStoryIds = await pmRepository.listStories(projectName, otherEpicName)

      for (const otherStoryId of otherStoryIds) {
        try {
          const otherStory = await pmRepository.readStory(projectName, otherEpicName, otherStoryId)

          // Check if this story references any of the updated stories
          if (otherStory.relatedStories && Array.isArray(otherStory.relatedStories)) {
            let needsUpdate = false
            const updatedRelatedStories = otherStory.relatedStories.map((relatedId: string) => {
              const newId = idMapping.get(relatedId)
              if (newId) {
                needsUpdate = true
                return newId
              }
              return relatedId
            })

            if (needsUpdate) {
              const updatedOtherStory = {
                ...otherStory,
                relatedStories: updatedRelatedStories,
                updatedAt: generateTimestamp(),
              }
              await pmRepository.writeStory(projectName, otherEpicName, otherStoryId, updatedOtherStory)
            }
          }
        } catch (err) {
          console.warn(`Could not update relatedStories in ${otherStoryId}:`, err)
          // Continue with other stories
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        epic: updatedEpic,
        updatedStories: updatedStories.length,
        message: `Epic ID updated from ${oldEpicId} to ${newEpicId}. ${updatedStories.length} story(ies) updated.`,
      },
    })
  } catch (error) {
    console.error('Error updating epic ID:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update epic ID',
      },
      { status: 500 }
    )
  }
}

