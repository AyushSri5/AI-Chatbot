import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface CoursesResponse {
  courses: Array<{
    id: string
    title: string
    description?: string
    videoCount: number
    transcriptCount: number
    createdAt: string
  }>
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

export async function GET(req: NextRequest): Promise<NextResponse<CoursesResponse>> {
  try {
    const token = req.cookies.get('token')?.value
    const authResult = await verifyAdminAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { courses: [], error: authResult.error },
        { status: authResult.status }
      )
    }

    const { userId } = authResult

    // Get pagination parameters
    const url = new URL(req.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Number.parseInt(url.searchParams.get('limit') || '10', 10))
    const skip = (page - 1) * limit

    // Fetch all courses created by this admin with video and transcript counts
    const courses = await prisma.course.findMany({
      where: {
        createdBy: userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            videos: true,
            transcripts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description || undefined,
      videoCount: course._count.videos,
      transcriptCount: course._count.transcripts,
      createdAt: course.createdAt.toISOString(),
    }))

    return NextResponse.json(
      { courses: formattedCourses },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { courses: [], error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
