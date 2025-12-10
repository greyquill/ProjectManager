import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const PM_DATA_DIR = path.join(process.cwd(), 'pm')

export async function GET(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    const projectName = params.projectName
    const filePath = path.join(PM_DATA_DIR, projectName, 'business-docs.md')

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return NextResponse.json({ success: true, data: content })
    } catch (error) {
      // File doesn't exist, return empty content
      return NextResponse.json({ success: true, data: '' })
    }
  } catch (error) {
    console.error('Error reading business docs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to read business documentation' },
      { status: 500 }
    )
  }
}

