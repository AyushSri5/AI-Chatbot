import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface UnassignRequest {
  courseId: string
  studentIds: string[]
}

interface UnassignResponse {
  success: boolean
  message: string
  unassigned?: number
  notFound?: number
  error?: string
}

/**
 * Verifies admin authorization
 */
async function verifyAdminAuth(token: string | undefined): Promise<{ userId: string } | { error: string; status: number }> {
  if (!token) {
    return { error: 'Missing token', status: 401 }
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret') as { role: string; id: string }

    if (decoded.role !== 'admin') {
      return { error: 'Insufficient permissions', status: 403 }
    }

    return { userId: decoded.id }
  } catch (err) {
    console.error('Token verification error:', err)
    return { error: 'Token verification failed', status: 401 }
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<UnassignResponse>> {
  try {
    const token = req.cookies.get('token')?.value
    const authResult = await verifyAdminAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error, error: authResult.error },
        { status: authResult.status }
      )
    }

    const body: UnassignRequest = await req.json()
    const { courseId, studentIds } = body

    if (!courseId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid request: courseId and studentIds array required', error: 'Invalid request' },
        { status: 400 }
      )
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found', error: 'Course not found' },
        { status: 404 }
      )
    }

    // Delete course access records for specified students
    const deleteResult = await prisma.courseAccess.deleteMany({
      where: {
        courseId,
        userId: {
          in: studentIds,
        },
      },
    })

    const unassignedCount = deleteResult.count
    const notFoundCount = Math.max(0, studentIds.length - unassignedCount)

    console.log(`[ADMIN] Unassigned course ${courseId} from ${unassignedCount} students (${notFoundCount} not found)`)

    return NextResponse.json(
      {
        success: true,
        message: `Successfully unassigned course from ${unassignedCount} student${unassignedCount !== 1 ? 's' : ''}`,
        unassigned: unassignedCount,
        notFound: notFoundCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error unassigning course:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to unassign course', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
