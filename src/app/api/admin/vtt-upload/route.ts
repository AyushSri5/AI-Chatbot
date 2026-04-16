import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { parseVTTFile, isValidVTTFile } from '@/lib/vtt-parser'
import { chunkText, cleanText } from '@/lib/chunking'
import { generateEmbeddings } from '@/lib/embeddings'
import { storeEmbeddings } from '@/lib/qdrant'

interface VTTUploadRequest {
  courseId: string
  files: Array<{
    fileName: string
    content: string
  }>
  overlapTokens?: number
}

interface VTTUploadResponse {
  success: boolean
  message: string
  data?: {
    filesProcessed: number
    filesSkipped: number
    transcriptsStored: number
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

export async function POST(req: NextRequest): Promise<NextResponse<VTTUploadResponse>> {
  try {
    const { courseId, files, overlapTokens = 50 } = (await req.json()) as VTTUploadRequest

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: 'Course ID is required', error: 'Missing courseId' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No VTT files provided', error: 'Missing files' },
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

    // Verify course exists and user has permission
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
        { success: false, message: 'You do not have permission to upload files for this course', error: 'Permission denied' },
        { status: 403 }
      )
    }

    let filesProcessed = 0
    let transcriptsStored = 0
    let chunksCreated = 0
    let embeddingsGenerated = 0
    let vectorCollectionId = ''
    let filesSkipped = 0

    const allChunks: Array<{ content: string; videoId: string; chunkIndex: number }> = []

    // Process each VTT file
    for (const file of files) {
      try {
        // Validate VTT format
        if (!isValidVTTFile(file.fileName, file.content)) {
          console.warn(`File ${file.fileName} is not a valid VTT file, skipping`)
          filesSkipped++
          continue
        }

        // Parse VTT file
        const parsed = parseVTTFile(file.fileName, file.content)

        // Check if videoId already exists in this course
        const existingTranscript = await prisma.transcript.findFirst({
          where: {
            videoId: parsed.videoId,
            courseId,
          },
        })

        if (existingTranscript) {
          console.warn(`Transcript with videoId ${parsed.videoId} already exists for this course, skipping file ${file.fileName}`)
          filesSkipped++
          continue
        }

        filesProcessed++

        // Store transcript in database
        await prisma.transcript.create({
          data: {
            videoId: parsed.videoId,
            courseId,
            fileName: file.fileName,
            content: parsed.fullText,
            source: 'vtt',
          },
        })

        transcriptsStored++

        // Create chunks from transcript
        const cleanedText = cleanText(parsed.fullText)
        let textChunks: string[] = []
        if (cleanedText.length > 0) {
          textChunks = chunkText(cleanedText, 512, overlapTokens)
          for (let i = 0; i < textChunks.length; i++) {
            allChunks.push({
              content: textChunks[i],
              videoId: parsed.videoId,
              chunkIndex: i,
            })
          }
          chunksCreated += textChunks.length
        }

        console.log(`Processed ${file.fileName}: ${textChunks.length} chunks created`)
      } catch (error) {
        console.error(`Error processing file ${file.fileName}:`, error)
      }
    }

    if (transcriptsStored === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid VTT files were processed', error: 'No valid files' },
        { status: 400 }
      )
    }

    // Generate embeddings and store in vector DB
    if (allChunks.length > 0) {
      try {
        const collectionName = `course_${courseId}`

        // Ensure vector collection exists in database
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

        // Process embeddings in batches
        const batchSize = 100
        for (let i = 0; i < allChunks.length; i += batchSize) {
          const batch = allChunks.slice(i, i + batchSize)
          console.log(`Processing embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allChunks.length / batchSize)} (${batch.length} chunks)...`)

          try {
            // Generate embeddings for this batch
            const batchEmbeddings = await generateEmbeddings(batch)
            embeddingsGenerated += batchEmbeddings.length

            // Store embeddings in Qdrant immediately
            await storeEmbeddings(collectionName, batchEmbeddings)

            console.log(`Stored ${batchEmbeddings.length} embeddings in batch ${Math.floor(i / batchSize) + 1}`)

            // Explicitly clear batch data to free memory
            batchEmbeddings.length = 0
          } catch (batchError) {
            console.error(`Error processing embedding batch ${Math.floor(i / batchSize) + 1}:`, batchError)
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

    const skipMessage = filesSkipped > 0 ? `, skipped ${filesSkipped} duplicate(s)` : ''
    const successMessage = `Successfully uploaded and processed ${transcriptsStored} VTT file(s)${skipMessage}`

    return NextResponse.json(
      {
        success: true,
        message: successMessage,
        data: {
          filesProcessed,
          filesSkipped,
          transcriptsStored,
          chunksCreated,
          embeddingsGenerated,
          vectorCollectionId,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('VTT upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
