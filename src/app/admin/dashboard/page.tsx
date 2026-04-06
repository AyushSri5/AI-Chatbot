'use client'

import { useState } from 'react'

import Link from 'next/link'

const DUMMY_COURSES = [
  {
    id: 1,
    name: 'Introduction to Cyber Ethics',
    category: 'Computer Science • Level 101',
    modules: '12 Units',
    dateAdded: 'Oct 12, 2023',
    status: 'READY',
    statusColor: 'blue',
    icon: '🔒',
  },
  {
    id: 2,
    name: 'Neural Networks & Deep Learning',
    category: 'Advanced AI • Level 400',
    modules: '08 Units',
    dateAdded: 'Nov 02, 2023',
    status: 'IN TRAINING (74%)',
    statusColor: 'cyan',
    icon: '🧠',
  },
  {
    id: 3,
    name: 'Applied Mathematics for Robotics',
    category: 'Mathematics • Level 201',
    modules: '15 Units',
    dateAdded: 'Oct 28, 2023',
    status: 'SYNC FAIL',
    statusColor: 'red',
    icon: '🤖',
    hasError: true,
  },
  {
    id: 4,
    name: 'Quantum Physics Fundamentals',
    category: 'Physics • Level 301',
    modules: '22 Units',
    dateAdded: 'Sep 30, 2023',
    status: 'READY',
    statusColor: 'blue',
    icon: '⚛️',
  },
]

export default function AdminDashboardPage() {
  const [showErrorModal, setShowErrorModal] = useState(false)

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
            <p className="text-4xl font-bold text-slate-900">24</p>
            <span className="text-2xl">📋</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">ACTIVE TRAINING</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold text-blue-600">3</p>
            <span className="text-2xl">⚙️</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">SYNC ERRORS</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold text-red-600">1</p>
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
            {DUMMY_COURSES.map((course, idx) => (
              <tr key={course.id} className={idx !== DUMMY_COURSES.length - 1 ? 'border-b border-slate-200' : ''}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded flex items-center justify-center text-lg">
                      {course.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{course.name}</p>
                      <p className="text-xs text-slate-600">{course.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700 font-medium">{course.modules}</td>
                <td className="px-6 py-4 text-slate-700">{course.dateAdded}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold ${
                      course.statusColor === 'blue'
                        ? 'bg-blue-100 text-blue-700'
                        : course.statusColor === 'cyan'
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    {course.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {course.hasError ? (
                    <button
                      onClick={() => setShowErrorModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1"
                    >
                      🔍 CURATOR AI INSIGHTS
                    </button>
                  ) : (
                    <button className="text-slate-400 text-xs">•••</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          Showing 1 to 4 of 24 courses
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">🔍</span>
              <div>
                <h3 className="font-bold text-slate-900">CURATOR AI INSIGHTS</h3>
                <p className="text-xs text-slate-600">Applied Mathematics</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-6">
              Found 1 synchronization error in "Applied Mathematics". The source PDF has a corrupted header. Would you like to re-upload or skip the first 3 pages?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowErrorModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                DISMISS
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition">
                FIX ERROR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
