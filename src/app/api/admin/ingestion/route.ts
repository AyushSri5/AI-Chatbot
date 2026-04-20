import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { getPlaylistVideos } from '@/lib/youtube'
import { extractVideoTranscripts } from '@/lib/youtube-transcripts'
import { parseVTT, chunkText, cleanText } from '@/lib/chunking'
import { generateEmbeddings } from '@/lib/embeddings'
import { storeEmbeddings } from '@/lib/qdrant'

interface IngestionRequest {
  courseId: string
  playlistUrl?: string
  vttContent?: string
  overlapTokens?: number
}

interface IngestionResponse {
  success: boolean
  message: string
  data?: {
    videosProcessed: number
    chunksCreated: number
    embeddingsGenerated: number
    vectorCollectionId: string
  }
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

/**
 * Processes playlist and stores videos
 */
async function processPlaylist(playlistUrl: string, courseId: string): Promise<{ videos: Array<{ id: string; url: string; title: string }>; error?: string }> {
  const playlistResult = await getPlaylistVideos(playlistUrl)

  if (playlistResult.error) {
    return { videos: [], error: playlistResult.error }
  }

  const videos: Array<{ id: string; url: string; title: string }> = []

  for (const video of playlistResult.videos) {
    try {
      const storedVideo = await prisma.video.create({
        data: {
          courseId,
          videoUrl: video.url,
          transcriptSource: video.id,
        },
      })

      videos.push({
        id: storedVideo.id,
        url: video.url,
        title: video.title,
      })
    } catch (error) {
      console.error(`Failed to store video ${video.id}:`, error)
    }
  }

  return { videos }
}

/**
 * Processes transcripts and creates chunks
 */
function processTranscripts(
  transcripts: Array<{
    videoId: string
    fullText: string
  }>,
  overlapTokens: number
): Array<{ content: string; videoId: string; chunkIndex: number }> {
  console.log(`[CHUNKING] Starting to process ${transcripts.length} transcripts`)
  const allChunks: Array<{ content: string; videoId: string; chunkIndex: number }> = []

  for (const transcript of transcripts) {
    console.log(`[CHUNKING] Processing transcript for video: ${transcript.videoId}`)
    console.log(`[CHUNKING] Original text length: ${transcript.fullText.length} characters`)
    console.log(`[CHUNKING] Original text preview (first 300 chars): "${transcript.fullText.substring(0, 300)}..."`)

    const cleanedText = cleanText(transcript.fullText)
    console.log(`[CHUNKING] Cleaned text length: ${cleanedText.length} characters`)
    console.log(`[CHUNKING] Cleaned text preview (first 300 chars): "${cleanedText.substring(0, 300)}..."`)

    if (cleanedText.length === 0) {
      console.warn(`[CHUNKING] Cleaned text is empty for video: ${transcript.videoId}`)
      continue
    }

    const textChunks = chunkText(cleanedText, 512, overlapTokens)
    console.log(`[CHUNKING] Created ${textChunks.length} chunks for video: ${transcript.videoId}`)

    for (let i = 0; i < textChunks.length; i++) {
      allChunks.push({
        content: textChunks[i],
        videoId: transcript.videoId,
        chunkIndex: i,
      })
      
      // Log first 3 chunks
      if (i < 3) {
        console.log(`[CHUNKING] Chunk ${i} for ${transcript.videoId} (length: ${textChunks[i].length}): "${textChunks[i].substring(0, 150)}..."`)
      }
    }
    
    // Log last chunk
    if (textChunks.length > 3) {
      const lastIdx = textChunks.length - 1
      console.log(`[CHUNKING] Chunk ${lastIdx} for ${transcript.videoId} (length: ${textChunks[lastIdx].length}): "${textChunks[lastIdx].substring(0, 150)}..."`)
    }
  }

  console.log(`[CHUNKING] Total chunks created: ${allChunks.length}`)
  return allChunks
}

/**
 * Stores embeddings in Qdrant vector database
 */
async function storeEmbeddingsInVectorDB(
  collectionName: string,
  embeddings: Array<{
    text: string
    vector: number[]
    metadata: { videoId: string; chunkIndex: number; timestamp?: string }
  }>
): Promise<void> {
  try {
    await storeEmbeddings(collectionName, embeddings)
  } catch (error) {
    console.error(`Failed to store embeddings in Qdrant collection ${collectionName}:`, error)
    throw error
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<IngestionResponse>> {
  try {
    const { courseId, playlistUrl, vttContent, overlapTokens = 50 } = (await req.json()) as IngestionRequest

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: 'Course ID is required', error: 'Missing courseId' },
        { status: 400 }
      )
    }

    if (!playlistUrl && !vttContent) {
      return NextResponse.json(
        { success: false, message: 'Either playlistUrl or vttContent is required', error: 'Missing content source' },
        { status: 400 }
      )
    }

    const token = req.cookies.get('token')?.value
    const authResult = await verifyAdminAuth(token)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error, error: authResult.error },
        { status: authResult.status }
      )
    }

    const { userId } = authResult

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found', error: 'Invalid courseId' },
        { status: 404 }
      )
    }

    if (course.createdBy !== userId) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to ingest content for this course', error: 'Permission denied' },
        { status: 403 }
      )
    }

    let videosProcessed = 0
    let chunksCreated = 0
    let embeddingsGenerated = 0
    let vectorCollectionId = ''

    const videos: Array<{ id: string; url: string; title: string }> = []

    if (playlistUrl) {
      const playlistResult = await processPlaylist(playlistUrl, courseId)

      if (playlistResult.error) {
        return NextResponse.json(
          { success: false, message: 'Failed to fetch playlist', error: playlistResult.error },
          { status: 400 }
        )
      }

      videos.push(...playlistResult.videos)
      videosProcessed = videos.length
    }

    const allChunks: Array<{ content: string; videoId: string; chunkIndex: number }> = []

    if (videos.length > 0) {
      console.log(`[INGESTION] Extracting transcripts from ${videos.length} videos...`)

      const videoIds = videos.map((v) => {
        const match = /v=([^&]+)/.exec(v.url)
        return match ? match[1] : v.id
      })

      console.log(`[INGESTION] Extracted video IDs: ${videoIds.join(', ')}`)

      const transcripts = await extractVideoTranscripts(videoIds)

      console.log(`[INGESTION] Successfully extracted ${transcripts.length} transcripts`)

      if (transcripts.length > 0) {
        console.log(`[INGESTION] Starting to process transcripts for chunking...`)

        const transcriptChunks = processTranscripts(
          transcripts.map((t) => ({
            videoId: t.videoId,
            fullText: t.fullText,
          })),
          overlapTokens
        )

        allChunks.push(...transcriptChunks)
        chunksCreated = transcriptChunks.length
        console.log(`[INGESTION] Total chunks created: ${chunksCreated}`)
      } else {
        console.warn('[INGESTION] No transcripts could be extracted from videos')
        return NextResponse.json(
          { success: false, message: 'Failed to extract transcripts from any videos', error: 'No transcripts available' },
          { status: 400 }
        )
      }
    } else if (vttContent) {
      console.log('Using provided VTT content for ingestion')

      const videoId = 'vtt-upload'
      const vttChunks = parseVTT(vttContent)

      for (const chunk of vttChunks) {
        const cleanedContent = cleanText(chunk.content)

        if (cleanedContent.length > 0) {
          allChunks.push({
            content: cleanedContent,
            videoId,
            chunkIndex: chunk.metadata.chunkIndex,
          })
        }
      }

      chunksCreated = allChunks.length
    } else {
      return NextResponse.json(
        { success: false, message: 'No content source provided', error: 'Provide either playlistUrl or vttContent' },
        { status: 400 }
      )
    }

    if (allChunks.length > 0) {
      try {
        const collectionName = `course_${courseId}`

        let vectorCollection = await prisma.vectorCollection.findFirst({
          where: {
            courseId,
            collectionName,
          },
        })

        vectorCollection ??= await prisma.vectorCollection.create({
          data: {
            courseId,
            collectionName,
          },
        })

        vectorCollectionId = vectorCollection.id

        // Process embeddings and store in batches
        const batchSize = 100
        for (let i = 0; i < allChunks.length; i += batchSize) {
          const batch = allChunks.slice(i, i + batchSize)
          console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allChunks.length / batchSize)} (${batch.length} chunks)...`)

          try {
            // Generate embeddings for this batch
            const batchEmbeddings = await generateEmbeddings(batch)
            embeddingsGenerated += batchEmbeddings.length

            // Store embeddings in Qdrant immediately
            await storeEmbeddingsInVectorDB(collectionName, batchEmbeddings)

            console.log(`Stored ${batchEmbeddings.length} embeddings in batch ${Math.floor(i / batchSize) + 1}`)

            // Explicitly clear batch data to free memory
            batchEmbeddings.length = 0
          } catch (batchError) {
            console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, batchError)
            throw batchError
          }
        }

        // Clear allChunks after processing
        allChunks.length = 0

        console.log(`Generated and stored ${embeddingsGenerated} embeddings for course ${courseId}`)
        console.log(`Vector collection: ${collectionName} (ID: ${vectorCollection.id})`)
      } catch (error) {
        console.error('Failed to generate embeddings:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to generate embeddings', error: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Content ingestion completed successfully',
        data: {
          videosProcessed,
          chunksCreated,
          embeddingsGenerated,
          vectorCollectionId,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ingestion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
