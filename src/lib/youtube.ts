/**
 * Utility functions for YouTube playlist operations
 */

interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  url: string
}

interface PlaylistResponse {
  videos: YouTubeVideo[]
  error?: string
}

/**
 * Extracts playlist ID from a YouTube playlist URL
 * Supports formats:
 * - https://www.youtube.com/playlist?list=PLxxxxx
 * - https://youtube.com/playlist?list=PLxxxxx
 * - PLxxxxx (direct playlist ID)
 */
function extractPlaylistId(url: string): string | null {
  try {
    // If it's already a playlist ID
    if (url.startsWith('PL') && url.length > 20) {
      return url
    }

    // Parse URL
    const urlObj = new URL(url)
    const playlistId = urlObj.searchParams.get('list')
    return playlistId
  } catch {
    return null
  }
}

/**
 * Retrieves all videos from a YouTube playlist
 * Requires YOUTUBE_API_KEY environment variable
 * 
 * @param playlistUrl - YouTube playlist URL or playlist ID
 * @param maxResults - Maximum number of videos to fetch (default: 500)
 * @returns Promise with array of videos or error
 */
export async function getPlaylistVideos(
  playlistUrl: string,
  maxResults: number = 500
): Promise<PlaylistResponse> {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return {
        videos: [],
        error: 'YouTube API key not configured',
      }
    }

    const playlistId = extractPlaylistId(playlistUrl)
    if (!playlistId) {
      return {
        videos: [],
        error: 'Invalid YouTube playlist URL or ID',
      }
    }

    const videos: YouTubeVideo[] = []
    let pageToken: string | undefined
    let totalFetched = 0

    // Fetch all pages of playlist items with limit
    do {
      if (totalFetched >= maxResults) {
        console.log(`Reached maximum playlist size limit of ${maxResults} videos`)
        break
      }

      const playlistItemsUrl = new URL(
        'https://www.googleapis.com/youtube/v3/playlistItems'
      )
      playlistItemsUrl.searchParams.append('playlistId', playlistId)
      playlistItemsUrl.searchParams.append('part', 'snippet,contentDetails')
      playlistItemsUrl.searchParams.append('maxResults', '50')
      playlistItemsUrl.searchParams.append('key', apiKey)

      if (pageToken) {
        playlistItemsUrl.searchParams.append('pageToken', pageToken)
      }

      const playlistResponse = await fetch(playlistItemsUrl.toString(), {
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!playlistResponse.ok) {
        const errorData = await playlistResponse.json()
        return {
          videos: [],
          error: errorData.error?.message || 'Failed to fetch playlist items',
        }
      }

      const playlistData = await playlistResponse.json()

      // Get video IDs from playlist items
      const videoIds = playlistData.items
        .map((item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId)
        .filter(Boolean)

      if (videoIds.length === 0) {
        pageToken = playlistData.nextPageToken
        continue
      }

      // Fetch video details (title, description, duration, thumbnail)
      const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
      videosUrl.searchParams.append('id', videoIds.join(','))
      videosUrl.searchParams.append('part', 'snippet,contentDetails')
      videosUrl.searchParams.append('key', apiKey)

      const videosResponse = await fetch(videosUrl.toString(), {
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!videosResponse.ok) {
        const errorData = await videosResponse.json()
        return {
          videos: [],
          error: errorData.error?.message || 'Failed to fetch video details',
        }
      }

      const videosData = await videosResponse.json()

      // Map video data to our format
      videosData.items.forEach((video: {
        id: string
        snippet: {
          title: string
          description: string
          thumbnails: {
            high?: { url: string }
            default?: { url: string }
          }
        }
        contentDetails: { duration: string }
      }) => {
        if (totalFetched < maxResults) {
          videos.push({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail:
              video.snippet.thumbnails.high?.url ||
              video.snippet.thumbnails.default?.url ||
              '',
            duration: video.contentDetails.duration,
            url: `https://www.youtube.com/watch?v=${video.id}`,
          })
          totalFetched++
        }
      })

      pageToken = playlistData.nextPageToken
    } while (pageToken && totalFetched < maxResults)

    return { videos }
  } catch (error) {
    console.error('Error fetching playlist videos:', error)
    return {
      videos: [],
      error:
        error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Converts ISO 8601 duration to human-readable format
 * Example: PT1H30M45S -> 1:30:45
 */
export function formatDuration(isoDuration: string): string {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  let matches: RegExpExecArray | null = null
  
  const regexExec = regex.exec(isoDuration)
  matches = regexExec

  if (!matches) return '0:00'

  const hours = Number.parseInt(matches[1] || '0', 10)
  const minutes = Number.parseInt(matches[2] || '0', 10)
  const seconds = Number.parseInt(matches[3] || '0', 10)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
