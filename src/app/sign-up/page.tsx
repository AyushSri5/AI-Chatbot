'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const endpoint = role === 'student' 
        ? '/api/student/auth/sign-up' 
        : '/api/admin/auth/sign-up'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign up failed')
        return
      }

      router.push('/login')
    } catch (err: unknown) {
      console.error(err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* Header with Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center">
              <span className="text-white text-lg font-bold">📚</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Scholar Slate</h1>
          </div>
          <p className="text-slate-600 text-sm">Join the next generation of academic precision.</p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Create your account
          </h2>
          <p className="text-slate-600 text-sm mb-8">
            Select your role to get started with curated learning.
          </p>

          {/* Role Selection */}
          <div className="flex gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-4 px-4 rounded border-2 transition flex flex-col items-center gap-2 ${
                role === 'student'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">🎓</span>
              <span className="text-xs font-semibold text-slate-700 tracking-wide">I AM A STUDENT</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-4 px-4 rounded border-2 transition flex flex-col items-center gap-2 ${
                role === 'admin'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">👨‍💼</span>
              <span className="text-xs font-semibold text-slate-700 tracking-wide">I AM AN ADMIN</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-2 tracking-wide">
                FULL NAME
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-2 tracking-wide">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">✉️</span>
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
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-2 tracking-wide">
                PASSWORD
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3 py-2">
              <input
                id="agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="agree" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                I agree to the{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Privacy Policy
                </a>
                {' '}regarding my academic data.
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <span>→</span>}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Login
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
