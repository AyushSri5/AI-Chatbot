import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface StudentProfileResponse {
  id: string
  email: string
  credits: number
  role: string
  error?: string
}

/**
 * Verifies student authorization
 */
async function verifyStudentAuth(token: string | undefined): Promise<{ userId: string } | { error: string; status: number }> {
  if (!token) {
    return { error: 'Missing token', status: 401 }
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret') as { role: string; id: string }

    if (decoded.role !== 'student') {
      return { error: 'Insufficient permissions', status: 403 }
    }

    return { userId: decoded.id }
  } catch (err) {
    console.error('Token verification error:', err)
    return { error: 'Token verification failed', status: 401 }
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<StudentProfileResponse>> {
  try {
    const token = req.cookies.get('token')?.value
    const authResult = await verifyStudentAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { id: '', email: '', credits: 0, role: '', error: authResult.error },
        { status: authResult.status }
      )
    }

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: {
        id: true,
        email: true,
        credits: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { id: '', email: '', credits: 0, role: '', error: 'User not found' },
        { status: 404 }
      )
    }

    console.log(`[STUDENT] Fetched profile for user ${authResult.userId}`)

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        credits: user.credits,
        role: user.role,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json(
      { id: '', email: '', credits: 0, role: '', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
