import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface UpdateCreditsRequest {
  userId: string
  credits: number
  operation: 'set' | 'add' | 'subtract'
}

interface UpdateCreditsResponse {
  success: boolean
  message: string
  newCredits?: number
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

export async function POST(req: NextRequest): Promise<NextResponse<UpdateCreditsResponse>> {
  try {
    const token = req.cookies.get('token')?.value
    const authResult = await verifyAdminAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error, error: authResult.error },
        { status: authResult.status }
      )
    }

    const body: UpdateCreditsRequest = await req.json()
    const { userId, credits, operation } = body

    if (!userId || credits === undefined || !operation) {
      return NextResponse.json(
        { success: false, message: 'Invalid request: userId, credits, and operation required', error: 'Invalid request' },
        { status: 400 }
      )
    }

    if (credits < 0) {
      return NextResponse.json(
        { success: false, message: 'Credits cannot be negative', error: 'Invalid credits' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found', error: 'User not found' },
        { status: 404 }
      )
    }

    let newCredits = user.credits

    if (operation === 'set') {
      newCredits = credits
    } else if (operation === 'add') {
      newCredits = user.credits + credits
    } else if (operation === 'subtract') {
      newCredits = Math.max(0, user.credits - credits)
    }

    // Update user credits
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { credits: newCredits },
    })

    // Log the transaction
    try {
      await prisma.creditTransaction.create({
        data: {
          userId,
          creditsUsed: operation === 'set' ? credits : operation === 'add' ? credits : -credits,
          type: operation === 'set' ? 'set' : operation === 'add' ? 'add' : 'subtract',
        },
      })
      console.log(`[TRANSACTION] Logged transaction for user ${userId}: ${operation} ${credits} credits`)
    } catch (txError) {
      console.error('[TRANSACTION] Error logging transaction:', txError)
    }

    console.log(`[ADMIN] Updated credits for user ${userId}: ${user.credits} -> ${newCredits} (operation: ${operation})`)

    return NextResponse.json(
      {
        success: true,
        message: `Successfully updated credits for ${user.email}`,
        newCredits: updatedUser.credits,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating credits:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update credits', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
