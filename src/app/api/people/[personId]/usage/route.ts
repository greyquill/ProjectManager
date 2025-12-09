import { NextRequest, NextResponse } from 'next/server'
import { pmRepository } from '@/lib/pm-repository'

/**
 * GET /api/people/[personId]/usage
 * Check where a person is used across all projects
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { personId: string } }
) {
  try {
    const { personId } = params
    const usage = await pmRepository.checkPersonUsage(personId)
    return NextResponse.json({
      success: true,
      data: usage,
    })
  } catch (error) {
    console.error('Error checking person usage:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check person usage',
      },
      { status: 500 }
    )
  }
}


