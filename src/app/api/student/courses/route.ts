import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface StudentCoursesResponse {
  courses: Array<{
    id: string
    title: string
    description?: string
    videoCount: number
    transcriptCount: number
    progress: number
  }>
  total: number
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

export async function GET(req: NextRequest): Promise<NextResponse<StudentCoursesResponse>> {
  try {
    const token = req.cookies.get('token')?.value
    const authResult = await verifyStudentAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { courses: [], total: 0, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get pagination parameters
    const url = new URL(req.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Number.parseInt(url.searchParams.get('limit') || '10', 10))
    const skip = (page - 1) * limit

    // Fetch courses assigned to this student
    const courseAccess = await prisma.courseAccess.findMany({
      where: {
        userId: authResult.userId,
      },
      select: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            _count: {
              select: {
                videos: true,
                transcripts: true,
              },
            },
          },
        },
      },
      orderBy: {
        course: {
          createdAt: 'desc',
        },
      },
      skip,
      take: limit,
    })

    // Get total count
    const totalCount = await prisma.courseAccess.count({
      where: {
        userId: authResult.userId,
      },
    })

    const formattedCourses = courseAccess.map((access) => ({
      id: access.course.id,
      title: access.course.title,
      description: access.course.description,
      videoCount: access.course._count.videos,
      transcriptCount: access.course._count.transcripts,
      progress: Math.floor(Math.random() * 100), // Placeholder - can be calculated from chat history or video progress
    }))

    console.log(`[STUDENT] Fetched ${formattedCourses.length} courses for user ${authResult.userId}`)

    return NextResponse.json(
      {
        courses: formattedCourses,
        total: totalCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching student courses:', error)
    return NextResponse.json(
      { courses: [], total: 0, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
