import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { getPlaylistVideos, formatDuration } from '@/lib/youtube'

export async function POST(req: NextRequest) {
  try {
    const { playlistUrl } = await req.json()

    if (!playlistUrl) {
      return NextResponse.json(
        { error: 'Playlist URL is required' },
        { status: 400 }
      )
    }

    // Get token from cookies
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decode JWT token to verify user is admin
    try {
      const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret') as any
      
      if (decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can fetch playlists' },
          { status: 403 }
        )
      }
    } catch (err) {
      console.error('Token verification error:', err)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Fetch playlist videos
    const result = await getPlaylistVideos(playlistUrl)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Format durations for display
    const formattedVideos = result.videos.map((video) => ({
      ...video,
      duration: formatDuration(video.duration),
    }))

    return NextResponse.json(
      {
        videos: formattedVideos,
        count: formattedVideos.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Playlist fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
