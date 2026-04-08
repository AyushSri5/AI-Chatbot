# YouTube Playlist Integration Setup

This document explains how to set up and use the YouTube playlist fetching functionality.

## Prerequisites

You need a YouTube Data API key to use the playlist fetching feature.

### Getting a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

### Environment Setup

Add your YouTube API key to your `.env.local` file:

```env
YOUTUBE_API_KEY=your_api_key_here
```

## Usage

### Utility Function: `getPlaylistVideos()`

Located in `src/lib/youtube.ts`

**Function Signature:**
```typescript
async function getPlaylistVideos(playlistUrl: string): Promise<PlaylistResponse>
```

**Parameters:**
- `playlistUrl` (string): YouTube playlist URL or playlist ID
  - Supported formats:
    - `https://www.youtube.com/playlist?list=PLxxxxx`
    - `https://youtube.com/playlist?list=PLxxxxx`
    - `PLxxxxx` (direct playlist ID)

**Returns:**
```typescript
{
  videos: YouTubeVideo[],
  error?: string
}
```

**Video Object Structure:**
```typescript
{
  id: string              // YouTube video ID
  title: string           // Video title
  description: string     // Video description
  thumbnail: string       // Thumbnail URL
  duration: string        // ISO 8601 duration (e.g., "PT1H30M45S")
  url: string            // Full YouTube video URL
}
```

**Example Usage:**
```typescript
import { getPlaylistVideos, formatDuration } from '@/lib/youtube'

const result = await getPlaylistVideos('https://www.youtube.com/playlist?list=PLxxxxx')

if (result.error) {
  console.error('Error:', result.error)
} else {
  result.videos.forEach(video => {
    console.log(`${video.title} - ${formatDuration(video.duration)}`)
  })
}
```

### Helper Function: `formatDuration()`

Converts ISO 8601 duration format to human-readable format.

**Function Signature:**
```typescript
function formatDuration(isoDuration: string): string
```

**Examples:**
- `PT1H30M45S` → `1:30:45`
- `PT45M30S` → `45:30`
- `PT30S` → `0:30`

## API Endpoint

### POST `/api/admin/playlist/fetch`

Fetches videos from a YouTube playlist. Requires admin authentication.

**Request:**
```json
{
  "playlistUrl": "https://www.youtube.com/playlist?list=PLxxxxx"
}
```

**Response (Success):**
```json
{
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Video Title",
      "description": "Video description",
      "thumbnail": "https://i.ytimg.com/...",
      "duration": "3:33",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ],
  "count": 1
}
```

**Response (Error):**
```json
{
  "error": "Invalid YouTube playlist URL or ID"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid playlist URL or API error
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (user is not admin)
- `500`: Internal server error

## Frontend Integration

The content ingestion page (`src/app/admin/content-ingestion/page.tsx`) includes:

1. **Playlist URL Input**: Text field to enter YouTube playlist URL
2. **Fetch Button**: Triggers the API call to fetch videos
3. **Video List**: Displays fetched videos with thumbnails and duration
4. **Error Handling**: Shows error messages if fetch fails

### Features:
- Real-time validation
- Loading state during fetch
- Thumbnail preview with video title and duration
- Scrollable list for large playlists
- Error messages for failed requests

## Limitations

- YouTube API has rate limits (10,000 requests per day by default)
- Playlists with more than 50,000 videos may take longer to fetch
- Private playlists cannot be accessed
- Deleted or private videos are skipped

## Troubleshooting

### "YouTube API key not configured"
- Ensure `YOUTUBE_API_KEY` is set in `.env.local`
- Restart the development server after adding the environment variable

### "Invalid YouTube playlist URL or ID"
- Verify the playlist URL format
- Ensure the playlist is public or accessible
- Try using the direct playlist ID (e.g., `PLxxxxx`)

### "Quota exceeded"
- YouTube API has daily quota limits
- Wait until the next day or upgrade your API quota in Google Cloud Console

### No videos returned
- Verify the playlist is not empty
- Check if the playlist is public
- Ensure the API key has YouTube Data API v3 enabled
