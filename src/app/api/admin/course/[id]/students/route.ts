import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface AssignedStudentsResponse {
  students: Array<{
    id: string
    email: string
    role: string
    credits: number
    coursesEnrolled: number
  }>
  total: number
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AssignedStudentsResponse>> {
  try {
    const { id: courseId } = await params
    const token = req.cookies.get('token')?.value
    const authResult = await verifyAdminAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { students: [], total: 0, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get pagination parameters
    const url = new URL(req.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Number.parseInt(url.searchParams.get('limit') || '100', 10))
    const skip = (page - 1) * limit

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { students: [], total: 0, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Fetch students assigned to this course
    const courseAccess = await prisma.courseAccess.findMany({
      where: {
        courseId,
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            credits: true,
            _count: {
              select: {
                courses: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          email: 'asc',
        },
      },
      skip,
      take: limit,
    })

    // Get total count
    const totalCount = await prisma.courseAccess.count({
      where: {
        courseId,
      },
    })

    const formattedStudents = courseAccess.map((access) => ({
      id: access.user.id,
      email: access.user.email,
      role: access.user.role,
      credits: access.user.credits,
      coursesEnrolled: access.user._count.courses,
    }))

    console.log(`[ADMIN] Fetched ${formattedStudents.length} students assigned to course ${courseId}`)

    return NextResponse.json(
      {
        students: formattedStudents,
        total: totalCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching assigned students:', error)
    return NextResponse.json(
      { students: [], total: 0, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
