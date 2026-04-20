/**
 * YouTube Transcript Extraction Utility
 * Extracts transcripts from YouTube videos
 */

import { YoutubeTranscript } from 'youtube-transcript'

export interface TranscriptEntry {
  text: string
  startTime: number
  endTime: number
  duration: number
}

export interface VideoTranscript {
  videoId: string
  videoUrl: string
  transcript: TranscriptEntry[]
  fullText: string
}

/**
 * Extracts transcript from a single YouTube video
 */
/**
 * Extracts transcript from a single YouTube video
 */
export async function extractVideoTranscript(videoId: string): Promise<VideoTranscript | null> {
  try {
    console.log(`[TRANSCRIPT] Starting extraction for video: ${videoId}`)

    // Try to fetch English transcript first
    let transcript = null
    try {
      console.log(`[TRANSCRIPT] Attempting to fetch English transcript for video: ${videoId}`)
      transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
      console.log(`[TRANSCRIPT] Successfully fetched English transcript`)
    } catch (langError) {
      console.warn(`[TRANSCRIPT] English transcript not available, trying auto-generated captions:`, langError)
      // Fallback to auto-generated captions
      transcript = await YoutubeTranscript.fetchTranscript(videoId)
    }

    if (!transcript || transcript.length === 0) {
      console.warn(`[TRANSCRIPT] No transcript found for video: ${videoId}`)
      return null
    }

    console.log(`[TRANSCRIPT] Fetched ${transcript.length} transcript entries for video: ${videoId}`)
    console.log(`[TRANSCRIPT] Raw transcript entries (first 3):`)
    transcript.slice(0, 3).forEach((entry, idx) => {
      console.log(`  [${idx}] text: "${entry.text}", offset: ${entry.offset}, duration: ${entry.duration}`)
    })

    // Convert transcript entries to our format
    const entries: TranscriptEntry[] = transcript.map((entry) => ({
      text: String(entry.text || ''),
      startTime: Number(entry.offset || 0),
      endTime: Number((entry.offset || 0)) + Number(entry.duration || 0),
      duration: Number(entry.duration || 0),
    }))

    console.log(`[TRANSCRIPT] Converted ${entries.length} entries for video: ${videoId}`)

    // Combine all text
    const fullText = entries.map((e) => e.text).join(' ')
    console.log(`[TRANSCRIPT] Full text length: ${fullText.length} characters for video: ${videoId}`)
    console.log(`[TRANSCRIPT] Full text preview (first 500 chars): "${fullText.substring(0, 500)}..."`)

    const result = {
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      transcript: entries,
      fullText,
    }

    console.log(`[TRANSCRIPT] Successfully extracted transcript for video: ${videoId}`)
    return result
  } catch (error) {
    console.error(`[TRANSCRIPT] Error extracting transcript for video ${videoId}:`, error)
    return null
  }
}

/**
 * Extracts transcripts from multiple YouTube videos
 * Processes sequentially to minimize memory usage
 */
export async function extractVideoTranscripts(videoIds: string[]): Promise<VideoTranscript[]> {
  const transcripts: VideoTranscript[] = []
  const maxRetries = 3

  for (let i = 0; i < videoIds.length; i++) {
    console.log(`[TRANSCRIPT] Processing video ${i + 1}/${videoIds.length}: ${videoIds[i]}`)

    let retries = 0
    let transcript: VideoTranscript | null = null

    while (retries < maxRetries && !transcript) {
      try {
        transcript = await extractVideoTranscript(videoIds[i])
        if (transcript) {
          transcripts.push(transcript)
          console.log(`[TRANSCRIPT] Successfully added transcript for video ${videoIds[i]}`)
        }
      } catch (error) {
        retries++
        if (retries < maxRetries) {
          console.warn(`[TRANSCRIPT] Retry ${retries}/${maxRetries} for video ${videoIds[i]}`)
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
        } else {
          console.error(`[TRANSCRIPT] Failed to extract transcript for video ${videoIds[i]} after ${maxRetries} retries:`, error)
        }
      }
    }

    if (!transcript) {
      console.warn(`[TRANSCRIPT] Failed to extract transcript for video ${videoIds[i]} after ${maxRetries} retries`)
    }

    // Add delay to avoid rate limiting
    if (i < videoIds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Periodically allow garbage collection
    if ((i + 1) % 10 === 0) {
      if (global.gc) {
        global.gc()
      }
    }
  }

  return transcripts
}

/**
 * Formats transcript entries into readable text with timestamps
 */
export function formatTranscriptWithTimestamps(entries: TranscriptEntry[]): string {
  return entries
    .map((entry) => {
      const startTime = formatTime(entry.startTime)
      return `[${startTime}] ${entry.text}`
    })
    .join('\n')
}

/**
 * Converts milliseconds to HH:MM:SS format
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Extracts video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(url)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Extracts video IDs from a playlist
 * Note: This extracts IDs from the video objects returned by YouTube API
 */
export function extractVideoIdsFromPlaylist(
  videos: Array<{ id: string; url: string; title: string }>
): string[] {
  return videos.map((video) => {
    // Extract video ID from URL
    const videoId = extractVideoId(video.url)
    return videoId || video.id
  })
}
