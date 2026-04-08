'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CourseBuilderPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    category: 'Philosophy & Arts',
    level: 'Level 101 (Introductory)',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/course/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create course')
        return
      }

      // Redirect to content ingestion with course ID
      router.push(`/admin/content-ingestion?courseId=${data.course.id}`)
    } catch (err: unknown) {
      console.error(err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-blue-600 tracking-widest mb-3">● CURRICULUM DESIGN</p>
        <h1 className="text-5xl font-bold text-slate-900 mb-4">Create New Course</h1>
        <p className="text-slate-600 text-base leading-relaxed max-w-2xl">
          Initialize a new academic framework. The AI Curator will use these parameters to suggest curriculum structures and relevant source materials.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-12">
        {/* Form Section */}
        <div className="col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Course Title */}
            <div>
              <label htmlFor="title" className="block text-xs font-bold text-slate-900 mb-3 tracking-wide">
                Course Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Introduction to Ethics"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />
            </div>

            {/* Category and Level */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label htmlFor="category" className="block text-xs font-bold text-slate-900 mb-3 tracking-wide">
                  Category/Department
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none cursor-pointer"
                >
                  <option>Philosophy & Arts</option>
                  <option>Computer Science</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Advanced AI</option>
                </select>
              </div>
              <div>
                <label htmlFor="level" className="block text-xs font-bold text-slate-900 mb-3 tracking-wide">
                  Academic Level
                </label>
                <select
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none cursor-pointer"
                >
                  <option>Level 101 (Introductory)</option>
                  <option>Level 201 (Intermediate)</option>
                  <option>Level 301 (Advanced)</option>
                  <option>Level 400 (Expert)</option>
                </select>
              </div>
            </div>

            {/* Course Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-bold text-slate-900 mb-3 tracking-wide">
                Course Description
              </label>
              <textarea
                id="description"
                placeholder="A brief overview of the course objectives and key learning outcomes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={7}
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50 transition text-sm"
              >
                📋 Discard Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Creating...' : 'Continue to Content'} →
              </button>
            </div>
          </form>
        </div>

        {/* AI Guidance Section */}
        <div className="col-span-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 sticky top-8">
            {/* Header */}
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center shrink-0">
                <span className="text-white text-lg font-bold">⭐</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">AI Guidance Active</p>
                <p className="text-xs text-blue-600 font-semibold tracking-wide">ACADEMIC INTEGRITY SYSTEM</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-700 mb-6 leading-relaxed">
              Based on your selection of <span className="font-semibold">Introduction to Ethics</span>, I'll prepare curated modules on Deontology, Utilitarianism, and Modern Virtue Theory once you continue.
            </p>

            {/* Badges */}
            <div className="flex gap-2 mb-8">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">● BIAS CHECKED</span>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">● SOURCE VERIFIED</span>
            </div>

            {/* Info Cards */}
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-xs text-slate-600 font-bold tracking-wide">CREATION DATE</p>
                  <p className="font-semibold text-slate-900 text-sm">Oct 24, 2023</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">👁️</span>
                <div>
                  <p className="text-xs text-slate-600 font-bold tracking-wide">VISIBILITY</p>
                  <p className="font-semibold text-slate-900 text-sm">Admin Only</p>
                </div>
              </div>
            </div>

            {/* Inspiration Card */}
            <div className="bg-linear-to-b from-slate-800 to-slate-900 rounded-lg p-6 text-white overflow-hidden relative h-32 flex flex-col justify-end">
              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-300 mb-2 tracking-wide">INSPIRATION</p>
                <p className="font-bold text-lg">The Academic Soul</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
