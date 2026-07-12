'use client'

import React, { useEffect, useState } from 'react'
import { 
  Calendar, 
  Loader2, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { Booking } from '@/lib/types'
import { getBookingsAction } from '@/app/actions/admin'

export default function BookingsLeadsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => { fetchBookings() }, [])

  async function fetchBookings() {
    try {
      setLoading(true)
      setError(null)
      const data = await getBookingsAction()
      setBookings(data as Booking[] || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.phone && b.phone.includes(searchTerm))
    const matchesStatus = statusFilter === 'all' ? true : b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="admin-loader h-[60vh]">
        <Loader2 className="admin-loader-icon" />
      </div>
    )
  }

  return (
    <div className="admin-page">
      {/* Title */}
      <div>
        <h1 className="admin-heading">Consultation Bookings</h1>
        <p className="admin-subheading">Manage scheduled client consultations, payments and appointment timelines.</p>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-admin-muted)' }} />
          <input
            type="text"
            placeholder="Search client name, email or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="admin-input pl-9"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--color-admin-muted)' }} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="admin-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Checkout</option>
            <option value="confirmed">Confirmed / Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table / States */}
      {error ? (
        <div className="admin-error-bar">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Failed to load bookings: {error}</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="admin-empty">
          <Calendar className="admin-empty-icon" />
          <h3 className="admin-empty-title">No Bookings Found</h3>
          <p className="admin-empty-text">No consultations match your filter criteria or search fields.</p>
        </div>
      ) : (
        <div className="admin-table-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="admin-thead">
                <tr>
                  <th>Client Detail</th>
                  <th>Contact Info</th>
                  <th>Session Option</th>
                  <th>Schedule Date</th>
                  <th>Booking Status</th>
                </tr>
              </thead>
              <tbody className="admin-tbody">
                {filteredBookings.map(b => (
                  <tr key={b.id} className="admin-tr">
                    <td className="admin-td">
                      <span className="admin-cell-primary block">{b.name}</span>
                      {b.notes && (
                        <span className="admin-cell-muted max-w-[250px] truncate block mt-1" title={b.notes}>
                          Note: {b.notes}
                        </span>
                      )}
                    </td>
                    <td className="admin-td">
                      <div className="flex items-center gap-1.5 admin-cell-muted">
                        <Mail className="w-3.5 h-3.5" style={{ color: 'var(--color-admin-muted)' }} /> {b.email}
                      </div>
                      <div className="flex items-center gap-1.5 admin-cell-muted mt-1">
                        <Phone className="w-3.5 h-3.5" style={{ color: 'var(--color-admin-muted)' }} /> {b.phone}
                      </div>
                    </td>
                    <td className="admin-td">
                      <span className="admin-badge admin-badge-navy">{b.plans?.name || 'Consultation'}</span>
                    </td>
                    <td className="admin-td">
                      <div className="admin-cell-primary flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-admin-red)' }} />
                        {format(new Date(b.date), 'dd MMM yyyy')}
                      </div>
                      <div className="admin-cell-muted flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" style={{ color: 'var(--color-admin-muted)' }} /> {b.time}
                      </div>
                    </td>
                    <td className="admin-td">
                      <span className={`admin-badge capitalize ${
                        b.status === 'confirmed'
                          ? 'admin-badge-success'
                          : b.status === 'pending'
                          ? 'admin-badge-warn'
                          : 'admin-badge-error'
                      }`}>
                        {b.status === 'confirmed'
                          ? <CheckCircle className="w-3.5 h-3.5" />
                          : b.status === 'pending'
                          ? <Clock className="w-3.5 h-3.5" />
                          : <XCircle className="w-3.5 h-3.5" />}
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
