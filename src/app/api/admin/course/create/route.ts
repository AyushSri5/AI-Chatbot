import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    const { title, category, level, description } = await req.json()

    // Get token from cookies
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decode JWT token to get user ID
    let userId: string
    try {
      const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret') as any
      userId = decoded.id
      
      // Verify user is admin
      if (decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can create courses' },
          { status: 403 }
        )
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Validate required fields
    if (!title || !category || !level || !description) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Create the course
    const course = await prisma.course.create({
      data: {
        title,
        description,
        createdBy: userId,
      },
    })

    return NextResponse.json(
      {
        message: 'Course created successfully',
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          createdBy: course.createdBy,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Course creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
