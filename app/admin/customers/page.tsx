'use client'

import React, { useEffect, useState } from 'react'
import {
  Loader2,
  Search,
  Plus,
  AlertCircle,
  ExternalLink,
  Users,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { Customer } from '@/lib/types'
import { getCustomersAction } from '@/app/actions/customer'

function formatMoney(n: number) {
  return `$${(n ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await getCustomersAction()
        if (!ignore) setCustomers((data as Customer[]) || [])
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const filtered = customers.filter(c => {
    const term = searchTerm.toLowerCase()
    return (
      c.display_name.toLowerCase().includes(term) ||
      (c.company_name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term)
    )
  })

  if (loading) {
    return (
      <div className="admin-loader h-[60vh]">
        <Loader2 className="admin-loader-icon animate-spin" />
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="admin-heading">Customers</h1>
          <p className="admin-subheading">Everyone who has booked a consultation, plus anyone you&apos;ve added by hand.</p>
        </div>
        <Link
          href="/admin/customers/new"
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all bg-[#E40229] hover:bg-[#c80224] cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="truncate">New Customer</span>
        </Link>
      </div>

      <div className="admin-toolbar">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-admin-muted)' }} />
          <input
            type="text"
            placeholder="Search name, company or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="admin-input !pl-10"
          />
        </div>
        <span className="admin-cell-muted text-xs font-semibold">{filtered.length} of {customers.length} customers</span>
      </div>

      {error ? (
        <div className="admin-error-bar">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Failed to load customers: {error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <Users className="admin-empty-icon" />
          <h3 className="admin-empty-title">No Customers Yet</h3>
          <p className="admin-empty-text">Customers appear here automatically once someone books a consultation, or you can add one manually.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 w-full">
            {filtered.map(c => (
              <Link
                key={c.id}
                href={`/admin/customers/${c.id}`}
                className="block p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">{c.display_name}</h4>
                    {c.company_name && <p className="text-xs text-slate-500 truncate">{c.company_name}</p>}
                  </div>
                  {c.source === 'booking' && (
                    <span className="admin-badge admin-badge-info shrink-0"><Sparkles className="w-3 h-3" /> From Booking</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-gray-500 truncate">{c.email || '—'}</span>
                  <span className="font-bold text-slate-800 shrink-0">{formatMoney(c.receivables || 0)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block admin-table-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="admin-thead">
                  <tr>
                    <th>Name</th>
                    <th>Company Name</th>
                    <th>Email</th>
                    <th>Work Phone</th>
                    <th className="text-right">Receivables (BCY)</th>
                    <th className="text-right">Unused Credits (BCY)</th>
                    <th className="text-right">&nbsp;</th>
                  </tr>
                </thead>
                <tbody className="admin-tbody">
                  {filtered.map(c => (
                    <tr key={c.id} className="admin-tr">
                      <td className="admin-td">
                        <Link href={`/admin/customers/${c.id}`} className="font-bold hover:underline" style={{ color: 'var(--color-admin-navy)' }}>
                          {c.display_name}
                        </Link>
                        {c.source === 'booking' && (
                          <span className="admin-badge admin-badge-info ml-2 align-middle"><Sparkles className="w-3 h-3" /> Booking</span>
                        )}
                      </td>
                      <td className="admin-td admin-cell-muted">{c.company_name || '—'}</td>
                      <td className="admin-td admin-cell-muted">
                        {c.email ? (
                          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{c.email}</span>
                        ) : '—'}
                      </td>
                      <td className="admin-td admin-cell-muted">
                        {(c.work_phone || c.mobile) ? (
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{c.work_phone || c.mobile}</span>
                        ) : '—'}
                      </td>
                      <td className="admin-td text-right font-bold" style={{ color: (c.receivables || 0) > 0 ? 'var(--color-admin-red)' : 'var(--color-admin-heading)' }}>
                        {formatMoney(c.receivables || 0)}
                      </td>
                      <td className="admin-td text-right font-bold" style={{ color: 'var(--color-admin-heading)' }}>
                        {formatMoney(c.unused_credits || 0)}
                      </td>
                      <td className="admin-td text-right">
                        <Link href={`/admin/customers/${c.id}`} className="inline-flex items-center gap-1 text-xs font-bold hover:underline" style={{ color: 'var(--color-admin-navy)' }}>
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
