import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface AssignmentRequest {
  courseId: string
  studentIds: string[]
}

interface AssignmentResponse {
  success: boolean
  message: string
  assigned?: number
  skipped?: number
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

export async function POST(req: NextRequest): Promise<NextResponse<AssignmentResponse>> {
  try {
    const token = req.cookies.get('token')?.value
    const authResult = await verifyAdminAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error, error: authResult.error },
        { status: authResult.status }
      )
    }

    const body: AssignmentRequest = await req.json()
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

    // Get existing assignments for this course
    const existingAssignments = await prisma.courseAccess.findMany({
      where: { courseId },
      select: { userId: true },
    })

    const existingUserIds = new Set(existingAssignments.map((a) => a.userId))

    // Filter out students who already have access
    const newStudentIds = studentIds.filter((id) => !existingUserIds.has(id))
    const skippedCount = studentIds.length - newStudentIds.length

    if (newStudentIds.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'All selected students already have access to this course',
          assigned: 0,
          skipped: skippedCount,
        },
        { status: 200 }
      )
    }

    // Create course access records for new students
    const courseAccessData = newStudentIds.map((userId) => ({
      userId,
      courseId,
    }))

    await prisma.courseAccess.createMany({
      data: courseAccessData,
      skipDuplicates: true,
    })

    console.log(`[ADMIN] Assigned course ${courseId} to ${newStudentIds.length} students (${skippedCount} already had access)`)

    return NextResponse.json(
      {
        success: true,
        message: `Successfully assigned course to ${newStudentIds.length} student${newStudentIds.length !== 1 ? 's' : ''}`,
        assigned: newStudentIds.length,
        skipped: skippedCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error assigning course:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to assign course', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
