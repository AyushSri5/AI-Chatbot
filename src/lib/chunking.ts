/**
 * Utility functions for text chunking and processing
 */

export interface TextChunk {
  content: string
  startTime?: string
  endTime?: string
  metadata: {
    videoId: string
    chunkIndex: number
    totalChunks: number
  }
}

/**
 * Chunks text into smaller pieces with overlap
 * @param text - The text to chunk
 * @param chunkSize - Size of each chunk in characters (default: 512)
 * @param overlapSize - Size of overlap between chunks in characters (default: 50)
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 512,
  overlapSize: number = 50
): string[] {
  if (!text || text.length === 0) {
    return []
  }

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.substring(start, end))

    // Move start position, accounting for overlap
    start = end - overlapSize

    // Prevent infinite loop if overlap is too large
    if (start <= chunks.length * (chunkSize - overlapSize)) {
      start = end
    }
  }

  return chunks
}

/**
 * Parses VTT subtitle format and extracts text with timestamps
 * @param vttContent - Raw VTT file content
 * @returns Array of chunks with timestamps
 */
export function parseVTT(vttContent: string): TextChunk[] {
  const lines = vttContent.split('\n')
  const chunks: TextChunk[] = []
  let currentTime = ''
  let currentText = ''

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip header and empty lines
    if (trimmedLine === 'WEBVTT' || trimmedLine === '' || trimmedLine.startsWith('NOTE')) {
      continue
    }

    // Check if line is a timestamp
    if (trimmedLine.includes('-->')) {
      if (currentText) {
        chunks.push({
          content: currentText.trim(),
          startTime: currentTime,
          endTime: trimmedLine.split('-->')[1].trim(),
          metadata: {
            videoId: '',
            chunkIndex: chunks.length,
            totalChunks: 0,
          },
        })
        currentText = ''
      }
      currentTime = trimmedLine.split('-->')[0].trim()
    } else if (trimmedLine && !trimmedLine.includes('-->')) {
      // This is subtitle text
      currentText += (currentText ? ' ' : '') + trimmedLine
    }
  }

  // Add last chunk if exists
  if (currentText) {
    chunks.push({
      content: currentText.trim(),
      startTime: currentTime,
      metadata: {
        videoId: '',
        chunkIndex: chunks.length,
        totalChunks: 0,
      },
    })
  }

  // Update total chunks count
  chunks.forEach((chunk) => {
    chunk.metadata.totalChunks = chunks.length
  })

  return chunks
}

/**
 * Cleans text for embedding
 * Removes extra whitespace, special characters, etc.
 */
export function cleanText(text: string): string {
  return text
    .replaceAll(/\s+/g, ' ') // Replace multiple spaces with single space
    .replaceAll(/[^\w\s.,!?-]/g, '') // Remove special characters except punctuation
    .trim()
}

/**
 * Splits text into sentences
 */
export function splitIntoSentences(text: string): string[] {
  const sentenceRegex = /[^.!?]+[.!?]+/g
  const sentences = text.match(sentenceRegex) || []
  return sentences.map((s) => s.trim()).filter((s) => s.length > 0)
}
