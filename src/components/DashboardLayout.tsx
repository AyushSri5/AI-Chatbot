'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const pathname = usePathname()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Get user from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const isAdmin = user?.role === 'admin'

  const menuItems = isAdmin
    ? [
        { icon: '📊', label: 'Dashboard', href: '/admin/dashboard', id: 'dashboard' },
        { icon: '🔨', label: 'Course Builder', href: '/admin/course-builder', id: 'builder' },
        { icon: '👥', label: 'Users & Credits', href: '/admin/users', id: 'users' },
        { icon: '📝', label: 'Transaction History', href: '/admin/transactions', id: 'transactions' },
        { icon: '📈', label: 'Student Analytics', href: '#', id: 'analytics' },
        { icon: '⚙️', label: 'AI Settings', href: '#', id: 'settings' },
      ]
    : [
        { icon: '📊', label: 'Dashboard', href: '/student/dashboard', id: 'dashboard' },
        { icon: '📚', label: 'My Courses', href: '#', id: 'courses' },
        { icon: '📝', label: 'Assignments', href: '#', id: 'assignments' },
        { icon: '🏆', label: 'Progress', href: '#', id: 'progress' },
      ]

  async function handleLogout() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (res.ok) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        document.cookie = 'token=; path=/; max-age=0'
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setLoading(false)
      setShowLogoutModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <h1 className="font-bold text-slate-900 text-sm tracking-wide">CURATOR INTELLIGENCE</h1>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{isAdmin ? 'AI Tutor Admin' : 'Student'}</h3>
          <p className="text-xs text-slate-600">The Intelligent Curator</p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Menu */}
        <div className="px-3 py-4 border-t border-slate-200 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition">
            <span className="text-lg">❓</span>
            <span className="text-sm">Support</span>
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
          >
            <span className="text-lg">🚪</span>
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Search courses, modules..."
                  className="bg-transparent outline-none text-sm text-slate-700 placeholder-slate-500 w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button className="text-xs font-semibold text-slate-600 hover:text-slate-900">PLATFORM STATUS</button>
              <button className="text-xs font-semibold text-slate-600 hover:text-slate-900">DOCUMENTATION</button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition">🔔</button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition">⏱️</button>
              <button className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded transition">
                PUBLISH CHANGES
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.[0] || user?.email?.[0] || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-8 py-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Sign Out</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition disabled:opacity-50"
              >
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
