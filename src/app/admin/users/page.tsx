'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  role: string
  credits: number
  coursesEnrolled: number
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin'>('all')
  const [sortBy, setSortBy] = useState<'email' | 'credits' | 'courses'>('email')
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditOperation, setCreditOperation] = useState<'set' | 'add' | 'subtract'>('add')
  const [creditLoading, setCreditLoading] = useState(false)
  const [creditMessage, setCreditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const abortController = new AbortController()

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/students?limit=1000', {
          signal: abortController.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setUsers(data.students || [])
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching users:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()

    return () => {
      abortController.abort()
    }
  }, [])

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      return matchesSearch && matchesRole
    })
    .sort((a, b) => {
      if (sortBy === 'email') return a.email.localeCompare(b.email)
      if (sortBy === 'credits') return b.credits - a.credits
      if (sortBy === 'courses') return b.coursesEnrolled - a.coursesEnrolled
      return 0
    })

  const handleCreditClick = (user: User) => {
    setSelectedUser(user)
    setCreditAmount('')
    setCreditOperation('add')
    setCreditMessage(null)
    setShowCreditModal(true)
  }

  const handleUpdateCredits = async () => {
    if (!selectedUser || !creditAmount) return

    setCreditLoading(true)
    setCreditMessage(null)

    try {
      const res = await fetch('/api/admin/users/update-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          credits: Number.parseInt(creditAmount, 10),
          operation: creditOperation,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setCreditMessage({
          type: 'success',
          text: data.message,
        })

        // Update local state
        setUsers(
          users.map((u) =>
            u.id === selectedUser.id ? { ...u, credits: data.newCredits } : u
          )
        )

        setTimeout(() => {
          setShowCreditModal(false)
          setCreditMessage(null)
        }, 2000)
      } else {
        setCreditMessage({
          type: 'error',
          text: data.message || 'Failed to update credits',
        })
      }
    } catch (error) {
      console.error('Error updating credits:', error)
      setCreditMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setCreditLoading(false)
    }
  }

  const totalCredits = users.reduce((sum, u) => sum + u.credits, 0)
  const totalCourses = users.reduce((sum, u) => sum + u.coursesEnrolled, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-600 tracking-wide mb-2">USER MANAGEMENT</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Users & Credits</h1>
          <p className="text-slate-600">Manage user accounts and assign credits to students</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">TOTAL USERS</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-slate-900">{users.length}</p>
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
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">TOTAL ENROLLMENTS</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-purple-600">{totalCourses}</p>
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">AVG CREDITS</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-green-600">
                {users.length > 0 ? Math.round(totalCredits / users.length) : 0}
              </p>
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

              {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-semibold text-slate-700 mb-2">Search by Email</label>
              <input
                id="search"
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="role-filter" className="block text-sm font-semibold text-slate-700 mb-2">Filter by Role</label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'student' | 'admin')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort-by" className="block text-sm font-semibold text-slate-700 mb-2">Sort by</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'email' | 'credits' | 'courses')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="email">Email</option>
                <option value="credits">Credits</option>
                <option value="courses">Courses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">EMAIL</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">ROLE</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">CREDITS</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">COURSES</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-600">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-600">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id} className={idx < filteredUsers.length - 1 ? 'border-b border-slate-200' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-slate-900">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600">{user.credits}</span>
                        <span className="text-sm text-slate-600">💎</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{user.coursesEnrolled}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleCreditClick(user)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs flex items-center gap-1 transition"
                      >
                        💎 CREDITS
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && filteredUsers.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          )}
        </div>
      </div>

      {/* Credit Assignment Modal */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-600 tracking-wide mb-2">CREDIT MANAGEMENT</p>
                  <h2 className="text-2xl font-bold text-slate-900">Assign Credits</h2>
                  <p className="text-sm text-slate-600 mt-1">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setShowCreditModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {creditMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    creditMessage.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <p className="text-sm font-medium">{creditMessage.text}</p>
                </div>
              )}

              {/* Current Credits */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Current Credits</p>
                <p className="text-3xl font-bold text-blue-600">{selectedUser.credits}</p>
              </div>

              {/* Operation Selection */}
              <div>
                <label htmlFor="operation" className="block text-sm font-semibold text-slate-700 mb-3">Operation</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['set', 'add', 'subtract'] as const).map((op) => (
                    <button
                      key={op}
                      onClick={() => setCreditOperation(op)}
                      className={`py-2 px-3 rounded-lg font-semibold text-sm transition ${
                        creditOperation === op
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {op === 'set' && 'Set'}
                      {op === 'add' && 'Add'}
                      {op === 'subtract' && 'Subtract'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit Amount */}
              <div>
                <label htmlFor="credit-amount" className="block text-sm font-semibold text-slate-700 mb-2">
                  {creditOperation === 'set' ? 'Set to' : creditOperation === 'add' ? 'Add' : 'Subtract'} Credits
                </label>
                <input
                  id="credit-amount"
                  type="number"
                  min="0"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Preview */}
              {creditAmount && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-slate-600 mb-2">Preview</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">
                      {creditOperation === 'set'
                        ? `Credits will be set to ${creditAmount}`
                        : creditOperation === 'add'
                          ? `${selectedUser.credits} + ${creditAmount} = ${selectedUser.credits + Number.parseInt(creditAmount, 10)}`
                          : `${selectedUser.credits} - ${creditAmount} = ${Math.max(0, selectedUser.credits - Number.parseInt(creditAmount, 10))}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreditModal(false)}
                className="px-6 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCredits}
                disabled={!creditAmount || creditLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded transition"
              >
                {creditLoading ? 'Updating...' : 'Update Credits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
