import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'

/**
 * GET /api/archived
 * List all archived stories across all projects
 */
export async function GET(request: NextRequest) {
  try {
    const projects = await pmRepository.listProjects()
    const archivedStories: Array<{
      projectName: string
      epicName: string
      story: any
    }> = []

    for (const projectName of projects) {
      try {
        const epics = await pmRepository.listEpics(projectName)
        for (const epicName of epics) {
          try {
            const storyIds = await pmRepository.listStories(projectName, epicName)
            for (const storyId of storyIds) {
              try {
                const story = await pmRepository.readStory(projectName, epicName, storyId)
                if (story.archived && !story.deleted) {
                  archivedStories.push({
                    projectName,
                    epicName,
                    story,
                  })
                }
              } catch (error) {
                // Skip stories that can't be read
                console.warn(`Could not read story ${storyId}:`, error)
              }
            }
          } catch (error) {
            // Skip epics that can't be read
            console.warn(`Could not list stories for epic ${epicName}:`, error)
          }
        }
      } catch (error) {
        // Skip projects that can't be read
        console.warn(`Could not list epics for project ${projectName}:`, error)
      }
    }

    // Sort by updatedAt descending (most recently archived first)
    archivedStories.sort((a, b) => {
      const dateA = new Date(a.story.updatedAt || a.story.createdAt).getTime()
      const dateB = new Date(b.story.updatedAt || b.story.createdAt).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      data: archivedStories,
    })
  } catch (error) {
    console.error('Error listing archived stories:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list archived stories',
      },
      { status: 500 }
    )
  }
}

