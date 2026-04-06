'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = role === 'student' 
        ? '/api/student/auth/sign-in' 
        : '/api/admin/auth/sign-in'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign in failed')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Set token in cookie for middleware
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`

      router.push(role === 'student' ? '/student/dashboard' : '/admin/dashboard')
    } catch (err: unknown) {
      console.error(err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-900">EduCurator AI</h1>
        <div className="flex gap-6">
          <a href="/support" className="text-sm text-slate-600 hover:text-slate-900">
            Support
          </a>
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Login
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-center text-slate-600 text-sm mb-8">
            Access your Scholar Slate workspace.
          </p>

          {/* Role Tabs */}
          <div className="flex gap-0 mb-8 border-b border-slate-200">
            <button
              onClick={() => setRole('student')}
              className={`flex-1 py-3 text-center text-xs font-semibold tracking-wide transition-colors ${
                role === 'student'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              STUDENT
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`flex-1 py-3 text-center text-xs font-semibold tracking-wide transition-colors ${
                role === 'admin'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ADMIN
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-2 tracking-wide">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 tracking-wide">
                  PASSWORD
                </label>
                <a href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  FORGOT PASSWORD?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in to Workspace'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-500 font-semibold tracking-wide">OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* OAuth Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-300 rounded hover:bg-slate-50 transition">
              <span className="text-lg">🔍</span>
              <span className="text-xs font-semibold text-slate-700">GOOGLE</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-300 rounded hover:bg-slate-50 transition">
              <span className="text-lg">📊</span>
              <span className="text-xs font-semibold text-slate-700">OFFICE 365</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-slate-600 mt-6">
            New to Scholar Slate?{' '}
            <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-semibold">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2024 EDUCURATOR AI. ACADEMIC PRECISION.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-slate-700">PRIVACY POLICY</a>
            <a href="/terms" className="hover:text-slate-700">TERMS OF SERVICE</a>
            <a href="/help" className="hover:text-slate-700">HELP CENTER</a>
            <a href="/contact" className="hover:text-slate-700">CONTACT US</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
