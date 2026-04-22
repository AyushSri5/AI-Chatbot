'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Student {
  id: string
  email: string
  role: string
  credits: number
  coursesEnrolled: number
}

interface Course {
  id: string
  title: string
  description?: string
}

export default function CourseEnrollmentsPage() {
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'email' | 'credits' | 'courses'>('email')

  useEffect(() => {
    const abortController = new AbortController()

    const fetchData = async () => {
      try {
        // Fetch course details
        const courseRes = await fetch(`/api/admin/courses`, {
          signal: abortController.signal,
        })
        if (courseRes.ok) {
          const data = await courseRes.json()
          const foundCourse = data.courses?.find((c: Course) => c.id === courseId)
          if (foundCourse) {
            setCourse(foundCourse)
          }
        }

        // Fetch enrolled students
        const studentsRes = await fetch(`/api/admin/course/${courseId}/students?limit=1000`, {
          signal: abortController.signal,
        })
        if (studentsRes.ok) {
          const data = await studentsRes.json()
          setStudents(data.students || [])
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching data:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      abortController.abort()
    }
  }, [courseId])

  const filteredStudents = students
    .filter((student) => student.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'email') return a.email.localeCompare(b.email)
      if (sortBy === 'credits') return b.credits - a.credits
      if (sortBy === 'courses') return b.coursesEnrolled - a.coursesEnrolled
      return 0
    })

  const totalCredits = students.reduce((sum, s) => sum + s.credits, 0)
  const avgCredits = students.length > 0 ? Math.round(totalCredits / students.length) : 0
  const avgCourses = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.coursesEnrolled, 0) / students.length) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div>
            <p className="text-xs font-semibold text-green-600 tracking-wide mb-2">ENROLLMENT DETAILS</p>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{course?.title || 'Loading...'}</h1>
            <p className="text-slate-600">{course?.description || ''}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">TOTAL ENROLLED</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-green-600">{students.length}</p>
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">TOTAL CREDITS</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-blue-600">{totalCredits}</p>
              <span className="text-2xl">💎</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">AVG CREDITS</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-purple-600">{avgCredits}</p>
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">AVG COURSES</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-orange-600">{avgCourses}</p>
              <span className="text-2xl">📚</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'email' | 'credits' | 'courses')}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="email">Sort by Email</option>
                <option value="credits">Sort by Credits</option>
                <option value="courses">Sort by Courses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        {loading ? (
          <div className="text-center py-12 text-slate-600">Loading enrolled students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-5xl mb-4">👥</p>
            <p className="text-slate-600 mb-2 font-semibold">No students found</p>
            <p className="text-sm text-slate-500">
              {students.length === 0 ? 'No students enrolled in this course yet' : 'No students match your search'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-lg border border-slate-200 hover:shadow-lg transition p-6"
              >
                {/* Student Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {student.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{student.email}</p>
                    <p className="text-xs text-slate-600 capitalize mt-1">{student.role}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 my-4"></div>

                {/* Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Credits Available</span>
                    <span className="text-lg font-bold text-blue-600">{student.credits}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Courses Enrolled</span>
                    <span className="text-lg font-bold text-purple-600">{student.coursesEnrolled}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                  <span className="text-xs font-semibold text-green-700">Active Enrollment</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        {!loading && filteredStudents.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-slate-700">
              Showing <span className="font-semibold">{filteredStudents.length}</span> of{' '}
              <span className="font-semibold">{students.length}</span> enrolled students
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
