/**
 * Utility functions for generating embeddings using OpenAI
 */

import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface Embedding {
  text: string
  vector: number[]
  metadata: {
    videoId: string
    chunkIndex: number
    timestamp?: string
  }
}

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSION = 1536

/**
 * Generates an embedding for text using OpenAI
 */
export async function generateEmbedding(
  text: string,
  videoId: string,
  chunkIndex: number,
  timestamp?: string
): Promise<Embedding> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSION,
    })

    const vector = response.data[0].embedding

    return {
      text,
      vector,
      metadata: {
        videoId,
        chunkIndex,
        timestamp,
      },
    }
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Generates embeddings for multiple text chunks
 * Batches requests to optimize API usage
 */
export async function generateEmbeddings(
  chunks: Array<{
    content: string
    videoId: string
    chunkIndex: number
    timestamp?: string
  }>
): Promise<Embedding[]> {
  if (chunks.length === 0) {
    return []
  }

  try {
    // Batch embeddings in groups of 100 (OpenAI limit)
    const batchSize = 100
    const embeddings: Embedding[] = []

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      console.log(`Generating embeddings for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`)

      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch.map((c) => c.content),
        dimensions: EMBEDDING_DIMENSION,
      })

      for (let j = 0; j < batch.length; j++) {
        embeddings.push({
          text: batch[j].content,
          vector: response.data[j].embedding,
          metadata: {
            videoId: batch[j].videoId,
            chunkIndex: batch[j].chunkIndex,
            timestamp: batch[j].timestamp,
          },
        })
      }
    }

    return embeddings
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
}

/**
 * Calculates cosine similarity between two vectors
 * Used for vector search/retrieval
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    mag1 += vec1[i] * vec1[i]
    mag2 += vec2[i] * vec2[i]
  }

  mag1 = Math.sqrt(mag1)
  mag2 = Math.sqrt(mag2)

  if (mag1 === 0 || mag2 === 0) {
    return 0
  }

  return dotProduct / (mag1 * mag2)
}

/**
 * Configuration for embedding service
 */
export const embeddingConfig = {
  provider: 'openai',
  model: EMBEDDING_MODEL,
  dimension: EMBEDDING_DIMENSION,
  apiKey: process.env.OPENAI_API_KEY,
}
