import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface TranscriptsResponse {
  transcripts: Array<{
    id: string
    videoId: string
    fileName: string
    source: string
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

export async function GET(req: NextRequest): Promise<NextResponse<TranscriptsResponse>> {
  try {
    const url = new URL(req.url)
    const courseId = url.searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { transcripts: [], error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const token = req.cookies.get('token')?.value
    const authResult = await verifyAdminAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { transcripts: [], error: authResult.error },
        { status: authResult.status }
      )
    }

    const { userId } = authResult

    // Verify course exists and user has permission
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { transcripts: [], error: 'Course not found' },
        { status: 404 }
      )
    }

    if (course.createdBy !== userId) {
      return NextResponse.json(
        { transcripts: [], error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Fetch transcripts for this course
    const transcripts = await prisma.transcript.findMany({
      where: {
        courseId,
      },
      select: {
        id: true,
        videoId: true,
        fileName: true,
        source: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedTranscripts = transcripts.map((t) => ({
      id: t.id,
      videoId: t.videoId,
      fileName: t.fileName,
      source: t.source,
      createdAt: t.createdAt.toISOString(),
    }))

    return NextResponse.json(
      { transcripts: formattedTranscripts },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching transcripts:', error)
    return NextResponse.json(
      { transcripts: [], error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
