'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  Search,
  Filter,
  Plus,
  AlertCircle,
  ExternalLink,
  Receipt,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Invoice } from '@/lib/types'
import { getInvoicesAction } from '@/app/actions/invoice'

function formatMoney(n: number) {
  return `$${(n ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'admin-badge-navy',
  sent: 'admin-badge-info',
  paid: 'admin-badge-success',
  overdue: 'admin-badge-error',
  cancelled: 'admin-badge-error',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await getInvoicesAction()
        if (!ignore) setInvoices((data as Invoice[]) || [])
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]

  const summary = useMemo(() => {
    const active = invoices.filter(i => i.status !== 'cancelled')
    const totalOutstanding = active.reduce((sum, i) => sum + Number(i.balance_due), 0)
    const dueToday = active
      .filter(i => i.due_date === todayStr && Number(i.balance_due) > 0)
      .reduce((sum, i) => sum + Number(i.balance_due), 0)
    const in30 = new Date()
    in30.setDate(in30.getDate() + 30)
    const in30Str = in30.toISOString().split('T')[0]
    const dueWithin30 = active
      .filter(i => i.due_date >= todayStr && i.due_date <= in30Str && Number(i.balance_due) > 0)
      .reduce((sum, i) => sum + Number(i.balance_due), 0)
    const overdueInvoice = active
      .filter(i => i.due_date < todayStr && Number(i.balance_due) > 0)
      .reduce((sum, i) => sum + Number(i.balance_due), 0)

    const paidWithDates = active.filter(i => i.status === 'paid' && i.paid_at)
    const avgDaysToPay = paidWithDates.length
      ? Math.round(
          paidWithDates.reduce((sum, i) => {
            const days = (new Date(i.paid_at as string).getTime() - new Date(i.invoice_date).getTime()) / 86400000
            return sum + Math.max(days, 0)
          }, 0) / paidWithDates.length
        )
      : 0

    return { totalOutstanding, dueToday, dueWithin30, overdueInvoice, avgDaysToPay }
  }, [invoices, todayStr])

  const filtered = invoices.filter(i => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      i.bill_to_name.toLowerCase().includes(term) ||
      i.bill_to_email.toLowerCase().includes(term) ||
      i.invoice_number.toLowerCase().includes(term)
    const matchesStatus = statusFilter === 'all' ? true : i.status === statusFilter
    return matchesSearch && matchesStatus
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="admin-heading">Invoices</h1>
          <p className="admin-subheading">Create, send and track invoices for consultations and case fees.</p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all bg-[#E40229] hover:bg-[#c80224] cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="truncate">New Invoice</span>
        </Link>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="admin-card-padded space-y-1">
          <p className="admin-label">Outstanding</p>
          <p className="admin-value text-lg sm:text-2xl">{formatMoney(summary.totalOutstanding)}</p>
        </div>
        <div className="admin-card-padded space-y-1">
          <p className="admin-label">Due Today</p>
          <p className="admin-value text-lg sm:text-2xl">{formatMoney(summary.dueToday)}</p>
        </div>
        <div className="admin-card-padded space-y-1">
          <p className="admin-label">Due in 30 Days</p>
          <p className="admin-value text-lg sm:text-2xl">{formatMoney(summary.dueWithin30)}</p>
        </div>
        <div className="admin-card-padded space-y-1">
          <p className="admin-label" style={{ color: 'var(--color-admin-red)' }}>Overdue</p>
          <p className="admin-value text-lg sm:text-2xl" style={{ color: 'var(--color-admin-red)' }}>{formatMoney(summary.overdueInvoice)}</p>
        </div>
        <div className="admin-card-padded space-y-1 col-span-2 lg:col-span-1">
          <p className="admin-label">Avg. Days to Get Paid</p>
          <p className="admin-value text-lg sm:text-2xl">{summary.avgDaysToPay}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-admin-muted)' }} />
          <input
            type="text"
            placeholder="Search customer or invoice #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="admin-input !pl-10"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--color-admin-muted)' }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select">
            <option value="all">All Statuses ({invoices.length})</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="admin-error-bar">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Failed to load invoices: {error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <Receipt className="admin-empty-icon" />
          <h3 className="admin-empty-title">No Invoices Found</h3>
          <p className="admin-empty-text">No invoices match your filter criteria, or none have been created yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 w-full">
            {filtered.map(inv => (
              <Link
                key={inv.id}
                href={`/admin/invoices/${inv.id}`}
                className="block p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-gray-500">{inv.invoice_number}</p>
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">{inv.bill_to_name}</h4>
                  </div>
                  <span className={`admin-badge capitalize shrink-0 ${STATUS_BADGE[inv.status]}`}>{inv.status}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-gray-500">Due {format(new Date(inv.due_date), 'dd MMM yyyy')}</span>
                  <span className="font-bold text-slate-800">{formatMoney(inv.total)}</span>
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
                    <th>Date</th>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Balance Due</th>
                    <th className="text-right">&nbsp;</th>
                  </tr>
                </thead>
                <tbody className="admin-tbody">
                  {filtered.map(inv => (
                    <tr key={inv.id} className="admin-tr">
                      <td className="admin-td admin-cell-muted">{format(new Date(inv.invoice_date), 'dd/MM/yyyy')}</td>
                      <td className="admin-td">
                        <Link href={`/admin/invoices/${inv.id}`} className="font-bold hover:underline" style={{ color: 'var(--color-admin-navy)' }}>
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="admin-td">
                        <span className="admin-cell-primary block">{inv.bill_to_name}</span>
                        <span className="admin-cell-muted">{inv.bill_to_email}</span>
                      </td>
                      <td className="admin-td">
                        <span className={`admin-badge capitalize ${STATUS_BADGE[inv.status]}`}>{inv.status}</span>
                      </td>
                      <td className="admin-td admin-cell-muted">{format(new Date(inv.due_date), 'dd/MM/yyyy')}</td>
                      <td className="admin-td text-right font-bold" style={{ color: 'var(--color-admin-heading)' }}>{formatMoney(inv.total)}</td>
                      <td className="admin-td text-right font-bold" style={{ color: inv.balance_due > 0 ? 'var(--color-admin-red)' : 'var(--color-admin-heading)' }}>
                        {formatMoney(inv.balance_due)}
                      </td>
                      <td className="admin-td text-right">
                        <Link href={`/admin/invoices/${inv.id}`} className="inline-flex items-center gap-1 text-xs font-bold hover:underline" style={{ color: 'var(--color-admin-navy)' }}>
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
