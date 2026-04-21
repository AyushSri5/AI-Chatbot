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
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showUnassignModal, setShowUnassignModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<Array<{
    id: string
    email: string
    role: string
    credits: number
    coursesEnrolled: number
  }>>([])
  const [assignedStudents, setAssignedStudents] = useState<Array<{
    id: string
    email: string
    role: string
    credits: number
    coursesEnrolled: number
  }>>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [assignmentMessage, setAssignmentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const handleAssignClick = async (course: Course) => {
    setSelectedCourse(course)
    setShowAssignModal(true)
    setSelectedStudents(new Set())
    await fetchStudents()
  }

  const handleUnassignClick = async (course: Course) => {
    setSelectedCourse(course)
    setShowUnassignModal(true)
    setSelectedStudents(new Set())
    await fetchAssignedStudents(course.id)
  }

  const fetchStudents = async () => {
    setLoadingStudents(true)
    try {
      const res = await fetch('/api/admin/students?limit=100')
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchAssignedStudents = async (courseId: string) => {
    setLoadingStudents(true)
    try {
      const res = await fetch('/api/admin/students?limit=100')
      if (res.ok) {
        const data = await res.json()
        // Filter to show only students assigned to this course
        const allStudents = data.students || []
        // In a real scenario, you'd fetch students specifically assigned to this course
        // For now, we'll show all students and let the admin select who to unassign
        setAssignedStudents(allStudents)
      }
    } catch (error) {
      console.error('Error fetching assigned students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleConfirmAssignment = async () => {
    if (!selectedCourse || selectedStudents.size === 0) return

    setAssignmentLoading(true)
    setAssignmentMessage(null)

    try {
      const res = await fetch('/api/admin/course-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          studentIds: Array.from(selectedStudents),
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setAssignmentMessage({
          type: 'success',
          text: data.message,
        })
        setTimeout(() => {
          setShowAssignModal(false)
          setAssignmentMessage(null)
        }, 2000)
      } else {
        setAssignmentMessage({
          type: 'error',
          text: data.message || 'Failed to assign course',
        })
      }
    } catch (error) {
      console.error('Error assigning course:', error)
      setAssignmentMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred while assigning the course',
      })
    } finally {
      setAssignmentLoading(false)
    }
  }

  const handleConfirmUnassignment = async () => {
    if (!selectedCourse || selectedStudents.size === 0) return

    setAssignmentLoading(true)
    setAssignmentMessage(null)

    try {
      const res = await fetch('/api/admin/course-unassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          studentIds: Array.from(selectedStudents),
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setAssignmentMessage({
          type: 'success',
          text: data.message,
        })
        setTimeout(() => {
          setShowUnassignModal(false)
          setAssignmentMessage(null)
        }, 2000)
      } else {
        setAssignmentMessage({
          type: 'error',
          text: data.message || 'Failed to unassign course',
        })
      }
    } catch (error) {
      console.error('Error unassigning course:', error)
      setAssignmentMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred while unassigning the course',
      })
    } finally {
      setAssignmentLoading(false)
    }
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssignClick(course)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs flex items-center gap-1 transition"
                      >
                        ✓ ASSIGN
                      </button>
                      <button
                        onClick={() => handleUnassignClick(course)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-xs flex items-center gap-1 transition"
                      >
                        ✕ UNASSIGN
                      </button>
                      <Link
                        href={`/admin/content-ingestion?courseId=${course.id}`}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
                      >
                        Manage
                      </Link>
                    </div>
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
      {/* Assign Course Modal */}
      {showAssignModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-600 tracking-wide mb-2">COURSE MANAGEMENT</p>
                  <h2 className="text-2xl font-bold text-slate-900">Assign Course</h2>
                  <p className="text-sm text-slate-600 mt-1">{selectedCourse.title}</p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {assignmentMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    assignmentMessage.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <p className="text-sm font-medium">{assignmentMessage.text}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-4">
                  Select Students ({selectedStudents.size} selected)
                </p>

                {loadingStudents ? (
                  <div className="text-center py-8 text-slate-600">Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">No students found</div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedStudents.size === students.length && students.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents(new Set(students.map((s) => s.id)))
                                } else {
                                  setSelectedStudents(new Set())
                                }
                              }}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">EMAIL</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">CREDITS</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">COURSES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, idx) => (
                          <tr key={student.id} className={idx < students.length - 1 ? 'border-b border-slate-200' : ''}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedStudents.has(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900">{student.email}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{student.credits}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{student.coursesEnrolled}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-6 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={selectedStudents.size === 0 || assignmentLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded transition"
              >
                {assignmentLoading ? 'Assigning...' : `Confirm Assignment (${selectedStudents.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Course Modal */}
      {showUnassignModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-red-600 tracking-wide mb-2">COURSE MANAGEMENT</p>
                  <h2 className="text-2xl font-bold text-slate-900">Unassign Course</h2>
                  <p className="text-sm text-slate-600 mt-1">{selectedCourse.title}</p>
                </div>
                <button
                  onClick={() => setShowUnassignModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {assignmentMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    assignmentMessage.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <p className="text-sm font-medium">{assignmentMessage.text}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-4">
                  Select Students to Unassign ({selectedStudents.size} selected)
                </p>

                {loadingStudents ? (
                  <div className="text-center py-8 text-slate-600">Loading students...</div>
                ) : assignedStudents.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">No students assigned to this course</div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedStudents.size === assignedStudents.length && assignedStudents.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents(new Set(assignedStudents.map((s) => s.id)))
                                } else {
                                  setSelectedStudents(new Set())
                                }
                              }}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">EMAIL</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">CREDITS</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">COURSES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedStudents.map((student, idx) => (
                          <tr key={student.id} className={idx < assignedStudents.length - 1 ? 'border-b border-slate-200' : ''}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedStudents.has(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900">{student.email}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{student.credits}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{student.coursesEnrolled}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowUnassignModal(false)}
                className="px-6 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnassignment}
                disabled={selectedStudents.size === 0 || assignmentLoading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded transition"
              >
                {assignmentLoading ? 'Unassigning...' : `Confirm Unassignment (${selectedStudents.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
