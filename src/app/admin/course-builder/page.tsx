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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/course/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create course')
        return
      }

      router.push('/admin/dashboard')
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
        <p className="text-xs font-semibold text-blue-600 tracking-wide mb-2">CURRICULUM DESIGN</p>
        <h1 className="text-4xl font-bold text-slate-900">Create New Course</h1>
        <p className="text-slate-600 mt-2">
          Initialize a new academic framework. The AI Curator will use these parameters to suggest curriculum structures and relevant source materials.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-900 mb-2">Course Title</label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Introduction to Ethics"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />
            </div>

            {/* Category and Level */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-slate-900 mb-2">Category/Department</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                >
                  <option>Philosophy & Arts</option>
                  <option>Computer Science</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Advanced AI</option>
                </select>
              </div>
              <div>
                <label htmlFor="level" className="block text-sm font-semibold text-slate-900 mb-2">Academic Level</label>
                <select
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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
              <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-2">Course Description</label>
              <textarea
                id="description"
                placeholder="A brief overview of the course objectives and key learning outcomes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                📋 Discard Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Continue to Content'} →
              </button>
            </div>
          </form>
        </div>

        {/* AI Guidance Section */}
        <div className="col-span-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-bold text-slate-900">AI Guidance Active</p>
                <p className="text-xs text-blue-600 font-semibold">ACADEMIC INTEGRITY SYSTEM</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 mb-6">
              Based on your selection of <span className="font-semibold">Introduction to Ethics</span>, I'll prepare curated modules on Deontology, Utilitarianism, and Modern Virtue Theory once you continue.
            </p>

            <div className="flex gap-2 mb-6">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">✓ BIAS CHECKED</span>
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">✓ SOURCE VERIFIED</span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <span>📅</span>
                <div>
                  <p className="text-xs text-slate-600">CREATION DATE</p>
                  <p className="font-semibold text-slate-900">Oct 24, 2023</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>👁️</span>
                <div>
                  <p className="text-xs text-slate-600">VISIBILITY</p>
                  <p className="font-semibold text-slate-900">Admin Only</p>
                </div>
              </div>
            </div>

            {/* Inspiration Card */}
            <div className="mt-6 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg p-4 text-white overflow-hidden relative">
              <div className="absolute inset-0 opacity-20 bg-cover" style={{ backgroundImage: 'url(data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext x="50" y="50" font-size="80" text-anchor="middle" dominant-baseline="middle"%3E📚%3C/text%3E%3C/svg%3E)' }}></div>
              <div className="relative z-10">
                <p className="text-xs font-semibold text-slate-300 mb-2">INSPIRATION</p>
                <p className="font-bold text-lg">The Academic Soul</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
