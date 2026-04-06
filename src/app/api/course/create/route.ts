import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, category, level, description } = await req.json()

    // Get user from token
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    // For now, we'll use a hardcoded admin user ID
    // In production, you'd decode the JWT token to get the actual user ID
    const adminUserId = 'admin-user-id' // This should come from token

    // Create the course
    const course = await prisma.course.create({
      data: {
        title,
        description,
        createdBy: adminUserId,
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
