'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  userId: string
  userEmail: string
  creditsUsed: number
  type: string
  createdAt: string
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'add' | 'subtract' | 'set'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'credits'>('date')

  useEffect(() => {
    const abortController = new AbortController()

    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/admin/transactions?limit=1000', {
          signal: abortController.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching transactions:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()

    return () => {
      abortController.abort()
    }
  }, [])

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch = transaction.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'credits') return Math.abs(b.creditsUsed) - Math.abs(a.creditsUsed)
      return 0
    })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getTypeColor = (type: string) => {
    if (type === 'add') return 'bg-green-100 text-green-700'
    if (type === 'subtract') return 'bg-red-100 text-red-700'
    if (type === 'set') return 'bg-blue-100 text-blue-700'
    return 'bg-slate-100 text-slate-700'
  }

  const getTypeIcon = (type: string) => {
    if (type === 'add') return '➕'
    if (type === 'subtract') return '➖'
    if (type === 'set') return '🔧'
    return '📝'
  }

  const totalCreditsAdded = transactions
    .filter((t) => t.type === 'add')
    .reduce((sum, t) => sum + t.creditsUsed, 0)

  const totalCreditsSubtracted = transactions
    .filter((t) => t.type === 'subtract')
    .reduce((sum, t) => sum + Math.abs(t.creditsUsed), 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-purple-600 tracking-wide mb-2">TRANSACTION MANAGEMENT</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Transaction History</h1>
          <p className="text-slate-600">View all credit transactions and assignments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">TOTAL TRANSACTIONS</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-slate-900">{transactions.length}</p>
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">CREDITS ADDED</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-green-600">+{totalCreditsAdded}</p>
              <span className="text-2xl">➕</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">CREDITS SUBTRACTED</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-red-600">-{totalCreditsSubtracted}</p>
              <span className="text-2xl">➖</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">NET CREDITS</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-blue-600">{totalCreditsAdded - totalCreditsSubtracted}</p>
              <span className="text-2xl">💎</span>
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
              <label htmlFor="type-filter" className="block text-sm font-semibold text-slate-700 mb-2">Filter by Type</label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'add' | 'subtract' | 'set')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="add">Add</option>
                <option value="subtract">Subtract</option>
                <option value="set">Set</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort-by" className="block text-sm font-semibold text-slate-700 mb-2">Sort by</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'credits')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date (Newest)</option>
                <option value="credits">Credits (Highest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">EMAIL</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">TYPE</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">CREDITS</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 tracking-wide">DATE & TIME</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-600">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-600">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, idx) => (
                  <tr key={transaction.id} className={idx < filteredTransactions.length - 1 ? 'border-b border-slate-200' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {transaction.userEmail.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-slate-900">{transaction.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(transaction.type)}`}>
                        <span>{getTypeIcon(transaction.type)}</span>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-bold ${
                            transaction.type === 'add'
                              ? 'text-green-600'
                              : transaction.type === 'subtract'
                                ? 'text-red-600'
                                : 'text-blue-600'
                          }`}
                        >
                          {transaction.type === 'subtract' ? '-' : '+'}
                          {Math.abs(transaction.creditsUsed)}
                        </span>
                        <span className="text-sm text-slate-600">💎</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-sm">{formatDate(transaction.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && filteredTransactions.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
