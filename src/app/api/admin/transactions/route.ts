import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface TransactionsResponse {
  transactions: Array<{
    id: string
    userId: string
    userEmail: string
    creditsUsed: number
    type: string
    createdAt: string
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

export async function GET(req: NextRequest): Promise<NextResponse<TransactionsResponse>> {
  try {
    const token = req.cookies.get('token')?.value
    const authResult = await verifyAdminAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { transactions: [], total: 0, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get pagination parameters
    const url = new URL(req.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Number.parseInt(url.searchParams.get('limit') || '50', 10))
    const skip = (page - 1) * limit

    // Fetch credit transactions
    const transactions = await prisma.creditTransaction.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
      skip,
      take: limit,
    }) as Array<{
      id: string
      userId: string
      creditsUsed: number
      type: string
      createdAt?: Date
      user: { email: string }
    }>

    // Get total count
    const totalCount = await prisma.creditTransaction.count()

    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      userId: transaction.userId,
      userEmail: transaction.user.email,
      creditsUsed: transaction.creditsUsed,
      type: transaction.type,
      createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString() : new Date().toISOString(),
    }))

    console.log(`[ADMIN] Fetched ${formattedTransactions.length} transactions (page ${page})`)

    return NextResponse.json(
      {
        transactions: formattedTransactions,
        total: totalCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { transactions: [], total: 0, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
