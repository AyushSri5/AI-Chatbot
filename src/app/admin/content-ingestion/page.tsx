'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'

interface Course {
  id: string
  title: string
  description: string
}

export default function ContentIngestionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const courseId = searchParams.get('courseId')
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [overlapTokens, setOverlapTokens] = useState('50')
  const [embedding, setEmbedding] = useState('Titan-V2')
  const [fetchingPlaylist, setFetchingPlaylist] = useState(false)
  const [playlistVideos, setPlaylistVideos] = useState<Array<{
    id: string
    title: string
    description: string
    thumbnail: string
    duration: string
    url: string
  }>>([])
  const [playlistError, setPlaylistError] = useState('')

  useEffect(() => {
    if (!courseId) {
      router.push('/admin/dashboard')
      return
    }

    // Fetch course details
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/admin/course/${courseId}`)
        if (res.ok) {
          const data = await res.json()
          setCourse(data.course)
        } else {
          router.push('/admin/dashboard')
        }
      } catch (error) {
        console.error('Error fetching course:', error)
        router.push('/admin/dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId, router])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files))
    }
  }

  const handleFetchPlaylist = async () => {
    if (!playlistUrl.trim()) {
      setPlaylistError('Please enter a playlist URL')
      return
    }

    setFetchingPlaylist(true)
    setPlaylistError('')
    setPlaylistVideos([])

    try {
      const res = await fetch('/api/admin/playlist/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPlaylistError(data.error || 'Failed to fetch playlist')
        return
      }

      setPlaylistVideos(data.videos || [])
    } catch (error) {
      console.error('Error fetching playlist:', error)
      setPlaylistError('An error occurred while fetching the playlist')
    } finally {
      setFetchingPlaylist(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading course...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Course not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <span>COURSE MANAGEMENT</span>
        <span>›</span>
        <span>KNOWLEDGE RETRIEVAL</span>
        <span>›</span>
        <span className="text-blue-600">CONTENT INGESTION</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Content Ingestion</h1>
        <p className="text-slate-600 text-base leading-relaxed max-w-3xl">
          Integrate structured educational data and multimedia resources into the AI&apos;s neural knowledge base using Retrieval-Augmented Generation (RAG).
        </p>
      </div>

      {/* Current Training Module */}
      <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
        <p className="text-xs font-bold text-slate-600 tracking-wide mb-2">CURRENT TRAINING MODULE</p>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center shrink-0">
              <span className="text-2xl">🎓</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Training: {course.title}</h3>
              <p className="text-sm text-slate-600">📋 Course ID: {course.id} &bull; Status: Pending Ingestion</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-600 tracking-wide mb-1">ESTIMATED TOKENS</p>
            <p className="text-2xl font-bold text-slate-900">~1.2M</p>
          </div>
        </div>
      </div>

      {/* Content Sources */}
      <div className="grid grid-cols-2 gap-8">
        {/* YouTube Playlist */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
              <span className="text-xl">📺</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">YouTube Playlist</h3>
              <p className="text-sm text-slate-600">Automated transcription and frame analysis</p>
            </div>
          </div>

          <div>
            <label htmlFor="playlist-url" className="block text-xs font-bold text-slate-900 mb-3 tracking-wide">PLAYLIST URL</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-100 border border-slate-200 rounded">
                <span>🔗</span>
                <input
                  id="playlist-url"
                  type="text"
                  placeholder="https://youtube.com/playlist?list=..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm placeholder-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={handleFetchPlaylist}
                disabled={fetchingPlaylist}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded transition text-sm"
              >
                {fetchingPlaylist ? 'Fetching...' : 'Fetch Playlist'} ↗
              </button>
            </div>
            {playlistError && (
              <p className="text-xs text-red-600 mt-2">{playlistError}</p>
            )}
          </div>

          {/* Playlist Videos */}
          {playlistVideos.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-600 tracking-wide">FETCHED VIDEOS ({playlistVideos.length})</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {playlistVideos.map((video) => (
                  <div key={video.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      width={64}
                      height={48}
                      className="rounded object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{video.title}</p>
                      <p className="text-xs text-slate-600">{video.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder Cards */}
          {playlistVideos.length === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-100 rounded-lg p-8 flex flex-col items-center justify-center gap-3 min-h-32">
                <span className="text-3xl opacity-50">🎬</span>
                <p className="text-xs text-slate-600 text-center">No videos loaded yet</p>
              </div>
              <div className="bg-slate-100 rounded-lg p-8 flex flex-col items-center justify-center gap-3 min-h-32">
                <span className="text-3xl opacity-50">⚙️</span>
                <p className="text-xs text-slate-600 text-center">Processing not started</p>
              </div>
            </div>
          )}
        </div>

        {/* VTT Transcript Upload */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
              <span className="text-xl">📄</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">VTT Transcript Upload</h3>
              <p className="text-sm text-slate-600">Structured text for RAG training</p>
            </div>
          </div>

          {/* Drop Zone */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center gap-4 min-h-48 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900 mb-1">Drop VTT files here</p>
              <p className="text-xs text-slate-600">Maximum file size: 50MB. Only .vtt formats supported.</p>
            </div>
            <label htmlFor="vtt-upload" className="px-6 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-white transition cursor-pointer text-sm">
              SELECT FILES
              <input
                id="vtt-upload"
                type="file"
                multiple
                accept=".vtt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600 tracking-wide">UPLOADED FILES</p>
              {uploadedFiles.map((file, idx) => (
                <div key={`file-${idx}-${file.name}`} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-sm text-slate-700">{file.name}</span>
                  <span className="text-xs text-slate-600">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Knowledge Fragmentation */}
      <div className="bg-slate-50 rounded-lg p-8 border border-slate-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">💡</span>
            </div>
            <h3 className="font-bold text-slate-900">Knowledge Fragmentation</h3>
          </div>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition text-sm flex items-center gap-2">
            Finalize & Start Training 🚀
          </button>
        </div>

        <p className="text-slate-700 mb-6 leading-relaxed">
          Configure how the AI chunks the content. Smaller chunks provide more granular retrieval but may lose broad context. Default is set to 512 tokens with 10% overlap.
        </p>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <label htmlFor="overlap-tokens" className="block text-xs font-bold text-slate-900 mb-3 tracking-wide">Overlap: 50 tokens</label>
            <input
              id="overlap-tokens"
              type="range"
              min="0"
              max="100"
              value={overlapTokens}
              onChange={(e) => setOverlapTokens(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="embedding-model" className="block text-xs font-bold text-slate-900 mb-3 tracking-wide">Embedding: Titan-V2</label>
            <select
              id="embedding-model"
              value={embedding}
              onChange={(e) => setEmbedding(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Titan-V2</option>
              <option>Titan-V1</option>
              <option>OpenAI-3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Uploaded Transcripts Section */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-slate-600 tracking-wide">UPLOADED TRANSCRIPTS</p>
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <p className="text-sm text-slate-600 text-center py-8">No transcripts uploaded yet</p>
        </div>
      </div>
    </div>
  )
}
