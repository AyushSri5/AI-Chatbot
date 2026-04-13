/**
 * Qdrant Vector Database Integration
 * Handles all operations with Qdrant for storing and retrieving embeddings
 */

import { QdrantClient } from '@qdrant/js-client-rest'
import { randomUUID } from 'node:crypto'

// Initialize Qdrant client
const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333'
const qdrantApiKey = process.env.QDRANT_API_KEY

export const qdrantClient = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey,
})

// OpenAI embedding dimension
const EMBEDDING_DIMENSION = 1536

/**
 * Generates a UUID for Qdrant point ID
 */
function generatePointId(): string {
  return randomUUID()
}

/**
 * Creates a collection in Qdrant if it doesn't exist
 */
export async function createCollectionIfNotExists(collectionName: string): Promise<void> {
  try {
    // Check if collection exists
    const collection = await qdrantClient.getCollection(collectionName)
    
    // Check if vector size matches
    const vectorConfig = collection.config?.params?.vectors as Record<string, unknown> | undefined
    const vectorSize = vectorConfig?.size as number | undefined
    if (vectorSize && vectorSize !== EMBEDDING_DIMENSION) {
      console.log(`Collection ${collectionName} exists but has wrong dimension (${vectorSize}). Recreating with ${EMBEDDING_DIMENSION}...`)
      await qdrantClient.deleteCollection(collectionName)
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: EMBEDDING_DIMENSION,
          distance: 'Cosine',
        },
      })
      console.log(`Collection ${collectionName} recreated with correct dimension`)
    } else {
      console.log(`Collection ${collectionName} already exists with correct dimension`)
    }
  } catch {
    // Collection doesn't exist, create it
    console.log(`Creating collection ${collectionName}...`)
    await qdrantClient.createCollection(collectionName, {
      vectors: {
        size: EMBEDDING_DIMENSION,
        distance: 'Cosine',
      },
    })
    console.log(`Collection ${collectionName} created successfully`)
  }
}

/**
 * Stores embeddings in Qdrant
 */
export async function storeEmbeddings(
  collectionName: string,
  embeddings: Array<{
    text: string
    vector: number[]
    metadata: {
      videoId: string
      chunkIndex: number
      timestamp?: string
    }
  }>
): Promise<void> {
  if (embeddings.length === 0) {
    console.log('No embeddings to store')
    return
  }

  // Ensure collection exists
  await createCollectionIfNotExists(collectionName)

  // Prepare points for Qdrant with UUID IDs
  const points = embeddings.map((e) => ({
    id: generatePointId(),
    vector: e.vector,
    payload: {
      text: e.text,
      videoId: e.metadata.videoId,
      chunkIndex: e.metadata.chunkIndex,
      timestamp: e.metadata.timestamp || '',
      collectionName,
    },
  }))

  // Upsert points in batches to avoid overwhelming the server
  const batchSize = 100
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize)
    console.log(`Upserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} points)...`)
    
    await qdrantClient.upsert(collectionName, {
      points: batch,
    })
  }

  console.log(`Successfully stored ${embeddings.length} embeddings in collection ${collectionName}`)
}

/**
 * Searches for similar embeddings in Qdrant
 */
export async function searchEmbeddings(
  collectionName: string,
  queryVector: number[],
  limit: number = 10,
  scoreThreshold: number = 0.5
): Promise<
  Array<{
    id: string
    score: number
    payload: Record<string, unknown>
  }>
> {
  try {
    const results = await qdrantClient.search(collectionName, {
      vector: queryVector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true,
    })

    return results.map((result) => ({
      id: result.id as string,
      score: result.score,
      payload: result.payload as Record<string, unknown>,
    }))
  } catch (error) {
    console.error(`Error searching collection ${collectionName}:`, error)
    throw error
  }
}

/**
 * Deletes a collection from Qdrant
 */
export async function deleteCollection(collectionName: string): Promise<void> {
  try {
    await qdrantClient.deleteCollection(collectionName)
    console.log(`Collection ${collectionName} deleted successfully`)
  } catch (error) {
    console.error(`Error deleting collection ${collectionName}:`, error)
    throw error
  }
}

/**
 * Gets collection info from Qdrant
 */
export async function getCollectionInfo(collectionName: string): Promise<Record<string, unknown>> {
  try {
    const info = await qdrantClient.getCollection(collectionName)
    return info as Record<string, unknown>
  } catch (error) {
    console.error(`Error getting collection info for ${collectionName}:`, error)
    throw error
  }
}

/**
 * Lists all collections in Qdrant
 */
export async function listCollections(): Promise<string[]> {
  try {
    const collections = await qdrantClient.getCollections()
    return collections.collections.map((c) => c.name)
  } catch (error) {
    console.error('Error listing collections:', error)
    throw error
  }
}

/**
 * Deletes points from a collection
 */
export async function deletePoints(collectionName: string, pointIds: string[]): Promise<void> {
  try {
    await qdrantClient.delete(collectionName, {
      points: pointIds,
    })
    console.log(`Deleted ${pointIds.length} points from collection ${collectionName}`)
  } catch (error) {
    console.error(`Error deleting points from ${collectionName}:`, error)
    throw error
  }
}

/**
 * Gets a specific point from a collection
 */
export async function getPoint(collectionName: string, pointId: string): Promise<Record<string, unknown> | null> {
  try {
    const points = await qdrantClient.retrieve(collectionName, {
      ids: [pointId],
      with_payload: true,
      with_vector: false,
    })
    return (points[0] as Record<string, unknown>) || null
  } catch (error) {
    console.error(`Error retrieving point ${pointId} from ${collectionName}:`, error)
    throw error
  }
}

/**
 * Counts points in a collection
 */
export async function countPoints(collectionName: string): Promise<number> {
  try {
    const info = await getCollectionInfo(collectionName)
    const pointsCount = info.points_count as number
    return pointsCount
  } catch (error) {
    console.error(`Error counting points in ${collectionName}:`, error)
    throw error
  }
}
