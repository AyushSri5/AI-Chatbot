import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user?.role || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid credentials or not an admin' },
        { status: 401 }
      )
    }

    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    )

    return NextResponse.json(
      {
        message: 'Admin sign in successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin sign in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
