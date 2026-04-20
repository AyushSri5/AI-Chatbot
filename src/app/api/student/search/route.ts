import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { OpenAI } from 'openai'
import { prisma } from '@/lib/prisma'
import { generateEmbedding } from '@/lib/embeddings'
import { searchEmbeddings } from '@/lib/qdrant'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    answer: string
    sources: SearchResult[]
    collectionId: string
  }
  error?: string
}

/**
 * Generates an answer using LLM based on context from search results
 */
async function generateAnswer(query: string, context: SearchResult[]): Promise<string> {
  if (context.length === 0) {
    return 'No relevant information found in the course materials to answer your question.'
  }

  // Combine context from search results
  const contextText = context
    .map((result, idx) => `[Source ${idx + 1}] ${result.text}`)
    .join('\n\n')

  const systemPrompt = `You are an intelligent educational assistant helping students learn from course materials. 
Your role is to:
1. Answer questions accurately based on the provided course context
2. Cite specific sources when referencing information
3. Explain concepts clearly and concisely
4. If the context doesn't contain enough information, acknowledge this and provide general knowledge if helpful
5. Maintain an encouraging and supportive tone

Always prioritize accuracy and only use information from the provided context. If information is not in the context, clearly state that.`

  const userMessage = `Based on the following course materials, please answer this question: "${query}"

Course Materials:
${contextText}

Please provide a clear, concise answer based on the materials above.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const answer = response.choices[0]?.message?.content || 'Unable to generate answer'
    return answer
  } catch (error) {
    console.error('Error generating answer:', error)
    throw error
  }
}
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

    // Generate answer using LLM with context
    let answer = ''
    try {
      answer = await generateAnswer(query, formattedResults)
      console.log('Generated answer successfully')
    } catch (error) {
      console.error('Error generating answer:', error)
      answer = 'Unable to generate answer at this time. Please try again later.'
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Answer generated successfully',
        data: {
          answer,
          sources: formattedResults,
          collectionId: vectorCollection.id,
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
