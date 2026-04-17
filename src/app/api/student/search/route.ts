import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { generateEmbedding } from '@/lib/embeddings'
import { searchEmbeddings } from '@/lib/qdrant'

interface SearchRequest {
  courseId: string
  query: string
  limit?: number
  scoreThreshold?: number
}

interface SearchResult {
  id: string
  score: number
  text: string
  videoId: string
  chunkIndex: number
}

interface SearchResponse {
  success: boolean
  message: string
  data?: {
    results: SearchResult[]
    collectionId: string
    queryEmbedding: number[]
  }
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

    return { userId: decoded.id }
  } catch (err) {
    console.error('Token verification error:', err)
    return { error: 'Token verification failed', status: 401 }
  }
}

/**
 * Extracts token from cookies or Authorization header
 */
function extractToken(req: NextRequest): string | undefined {
  // Check cookies first
  const cookieToken = req.cookies.get('token')?.value
  if (cookieToken) {
    return cookieToken
  }

  // Check Authorization header (Bearer token)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  }

  return undefined
}

export async function POST(req: NextRequest): Promise<NextResponse<SearchResponse>> {
  try {
    const { courseId, query, limit = 10, scoreThreshold = 0.5 } = (await req.json()) as SearchRequest

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: 'Course ID is required', error: 'Missing courseId' },
        { status: 400 }
      )
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Query is required', error: 'Missing query' },
        { status: 400 }
      )
    }

    const token = extractToken(req)
    const authResult = await verifyStudentAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found', error: 'Invalid courseId' },
        { status: 404 }
      )
    }

    // Get vector collection for this course
    const vectorCollection = await prisma.vectorCollection.findFirst({
      where: {
        courseId,
      },
    })

    if (!vectorCollection) {
      return NextResponse.json(
        { success: false, message: 'No vector collection found for this course', error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Generate embedding for the query
    console.log(`Generating embedding for query: "${query}"`)
    const queryEmbedding = await generateEmbedding(query, 'query', 0)

    // Search in Qdrant
    console.log(`Searching in collection: ${vectorCollection.collectionName}`)
    const searchResults = await searchEmbeddings(
      vectorCollection.collectionName,
      queryEmbedding.vector,
      Math.min(limit, 50), // Cap at 50 results
      scoreThreshold
    )

    // Format results
    const formattedResults: SearchResult[] = searchResults.map((result) => ({
      id: result.id as string,
      score: result.score,
      text: (result.payload?.text as string) || '',
      videoId: (result.payload?.videoId as string) || '',
      chunkIndex: (result.payload?.chunkIndex as number) || 0,
    }))

    console.log(`Found ${formattedResults.length} results for query`)

    return NextResponse.json(
      {
        success: true,
        message: `Found ${formattedResults.length} relevant result(s)`,
        data: {
          results: formattedResults,
          collectionId: vectorCollection.id,
          queryEmbedding: queryEmbedding.vector,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
