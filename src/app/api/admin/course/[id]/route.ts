import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    // Get token from cookies
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decode JWT token to verify user is admin
    try {
      const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret') as any
      
      if (decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can access courses' },
          { status: 403 }
        )
      }
    } catch (err) {
      console.error('Token verification error:', err)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Fetch the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          createdBy: course.createdBy,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Course fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
