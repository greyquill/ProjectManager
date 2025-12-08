import { NextRequest, NextResponse } from 'next/server'

const VALID_CODE = '2341' // In production, this would be in an environment variable

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (code === VALID_CODE) {
      // Create response with success
      const response = NextResponse.json({ success: true })

      // Set a secure cookie to maintain authentication
      response.cookies.set('pm-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return response
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid code' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }
}

