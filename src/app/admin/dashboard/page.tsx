'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  description?: string
  videoCount: number
  transcriptCount: number
  createdAt: string
}

export default function AdminDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeTraining: 0,
    syncErrors: 0,
  })

  useEffect(() => {
    const abortController = new AbortController()
    
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/admin/courses', {
          signal: abortController.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setCourses(data.courses || [])
          setStats({
            totalCourses: data.courses?.length || 0,
            activeTraining: 0,
            syncErrors: 0,
          })
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching courses:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()

    return () => {
      abortController.abort()
    }
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-blue-600 tracking-wide mb-2">MANAGEMENT CONSOLE</p>
          <h1 className="text-4xl font-bold text-slate-900">Course Management</h1>
          <p className="text-slate-600 mt-2">
            Organize and audit your AI-powered curriculum. Monitor training status across all semantic modules.
          </p>
        </div>
        <Link
          href="/admin/course-builder"
          className="bg-slate-700 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded flex items-center gap-2 transition"
        >
          <span>+</span> Add New Course
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">TOTAL COURSES</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold text-slate-900">{stats.totalCourses}</p>
            <span className="text-2xl">📋</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">ACTIVE TRAINING</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold text-blue-600">{stats.activeTraining}</p>
            <span className="text-2xl">⚙️</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">SYNC ERRORS</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold text-red-600">{stats.syncErrors}</p>
            <span className="text-2xl">⚠️</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">SYSTEM HEALTH</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold text-slate-900">98%</p>
            <span className="text-2xl">⚡</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">STATUS:</span>
            <button className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm font-medium hover:bg-slate-200">
              All Status
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">CATEGORY:</span>
            <button className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm font-medium hover:bg-slate-200 flex items-center gap-1">
              All Categories <span>▼</span>
            </button>
          </div>
        </div>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1">
          ⚙️ Advanced Filters
        </button>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">COURSE NAME</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">MODULES</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">DATE ADDED</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">TRAINING STATUS</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-600">
                  Loading courses...
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-600">
                  No courses yet. <Link href="/admin/course-builder" className="text-blue-600 hover:text-blue-700 font-semibold">Create one</Link>
                </td>
              </tr>
            ) : (
              courses.map((course, idx) => (
                <tr key={course.id} className={idx < courses.length - 1 ? 'border-b border-slate-200' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded flex items-center justify-center text-lg">
                        📚
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{course.title}</p>
                        <p className="text-xs text-slate-600">{course.description || 'No description'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">
                    {course.videoCount + course.transcriptCount}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{formatDate(course.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                      READY
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/content-ingestion?courseId=${course.id}`}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && courses.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            Showing 1 to {courses.length} of {stats.totalCourses} courses
          </div>
        )}
      </div>

      {/* Error Modal - Removed for now */}
    </div>
  )
}
