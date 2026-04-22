'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  description?: string
  videoCount: number
  transcriptCount: number
  progress: number
}

export default function StudentDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)
  const [userName, setUserName] = useState('Alex')

  useEffect(() => {
    const abortController = new AbortController()

    const fetchData = async () => {
      try {
        // Fetch courses
        const coursesRes = await fetch('/api/student/courses', {
          signal: abortController.signal,
        })
        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(data.courses || [])
        }

        // Fetch student profile with real credits
        const profileRes = await fetch('/api/student/profile', {
          signal: abortController.signal,
        })
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setCredits(profileData.credits || 0)
          setUserName(profileData.email?.split('@')[0] || 'Alex')
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
  }, [])

  const getColorClass = (index: number) => {
    const colors = ['bg-teal-100', 'bg-yellow-100', 'bg-blue-100', 'bg-purple-100', 'bg-pink-100']
    return colors[index % colors.length]
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-600 tracking-wide mb-2">DASHBOARD OVERVIEW</p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                Welcome back, <span className="text-blue-600">{userName}</span>. Your AI tutor is ready.
              </h1>
              <p className="text-slate-600 mt-3 max-w-2xl">
                You've completed 75% of your weekly goals. Focus on "Introduction to AI" to stay on track for your certification.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="8"
                    strokeDasharray={`${(Math.min(credits, 100) / 100) * 2 * Math.PI * 54} ${2 * Math.PI * 54}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-3xl font-bold text-slate-900">{credits}</p>
                  <p className="text-xs text-slate-600">AVAILABLE</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="font-semibold text-slate-900">AI Credits</p>
                <p className="text-xs text-slate-600">{credits} Credits available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credits Display */}
        <div className="mb-8 flex items-center justify-between bg-white rounded-lg p-4 border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-700">Credits: <span className="text-blue-600 text-lg">{credits}</span></p>
          </div>
        </div>

        {/* My Active Courses */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">My Active Courses</h2>
            <Link href="/student/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
              View All
            </Link>
          </div>

          {loading && (
            <div className="text-center py-12 text-slate-600">Loading courses...</div>
          )}
          {!loading && courses.length === 0 && (
            <div className="bg-white rounded-lg p-12 border border-slate-200 text-center">
              <p className="text-slate-600 mb-4">No courses assigned yet.</p>
              <p className="text-sm text-slate-500">Check back soon for new courses!</p>
            </div>
          )}
          {!loading && courses.length > 0 && (
            <div className="space-y-4">
              {courses.slice(0, 2).map((course, idx) => (
                <div key={course.id} className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg ${getColorClass(idx)} flex items-center justify-center text-xl font-semibold text-slate-700`}>
                        {course.title.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">{course.title}</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 max-w-xs">
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getProgressColor(course.progress)} transition-all`}
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{course.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/student/course/${course.id}`}
                      className="text-blue-600 hover:text-blue-700 text-2xl ml-4"
                    >
                      ▶
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Continue Learning */}
            {courses.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-slate-200 mb-8">
                <h3 className="font-semibold text-slate-900 mb-4">Continue Learning</h3>
                <div className="bg-linear-to-br from-yellow-100 to-yellow-50 rounded-lg p-6 mb-4 flex items-center justify-center h-48">
                  <div className="text-center">
                    <p className="text-4xl mb-2">▶</p>
                    <p className="text-sm text-slate-600">12:45 / 24:00</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-2">Topic: Neural Network Architectures</p>
                <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2 rounded transition">
                  Resume Video
                </button>
              </div>
            )}

            {/* Help Center */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="text-2xl">💬</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Stuck on a concept?</h3>
                  <p className="text-sm text-slate-600 mb-4">Our AI mentors and community experts are available 24/7.</p>
                  <Link href="/help" className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1">
                    Go to Help Center <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <div className="bg-white rounded-lg p-6 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Achievements</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Mastered: Supervised Learning</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">12-Day Study Streak!</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Top 5% in Data Science</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-lg p-6 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">NEXT STEPS</p>
              <h3 className="font-semibold text-slate-900 mb-3">Prepare for your "AI Ethics" mid-term quiz.</h3>
              <p className="text-sm text-slate-600 mb-4">
                Based on your recent activity, we recommend reviewing the "Bias in Data" module. 85% of successful students spent at least 2 hours on this section.
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition">
                Start Review Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
