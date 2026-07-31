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
  AlertCircle,
  Plus,
  ExternalLink,
  X,
  User,
  FileText,
  CheckCircle2,
  Bell,
  Star,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { Booking, Plan } from '@/lib/types'
import { 
  getBookingsAction, 
  createAdminBookingAction, 
  updateBookingStatusAction, 
  getAdminPlansAction,
  sendBookingReminderAction,
  sendGoogleReviewRequestAction
} from '@/app/actions/admin'

export default function BookingsLeadsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // One-click actions state
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null)
  const [sendingReviewId, setSendingReviewId] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)

  // Form state
  const todayStr = new Date().toISOString().split('T')[0]
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPlanId, setFormPlanId] = useState('')
  const [formDate, setFormDate] = useState(todayStr)
  const [formTime, setFormTime] = useState('10:00:00')
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState<'confirmed' | 'pending' | 'cancelled'>('confirmed')

  useEffect(() => { 
    let ignore = false
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const [bookingsData, plansData] = await Promise.all([
          getBookingsAction(),
          getAdminPlansAction()
        ])
        if (!ignore) {
          const fetchedBookings = (bookingsData as Booking[]) || []
          const fetchedPlans = (plansData as Plan[]) || []

          const fallbackPlans: Plan[] = [
            { id: '11111111-1111-1111-1111-111111111111', name: 'Phone Consultation', price_aud: 11407, duration_minutes: 30 },
            { id: '22222222-2222-2222-2222-222222222222', name: 'Online Video Consultation', price_aud: 17111, duration_minutes: 30 },
            { id: '33333333-3333-3333-3333-333333333333', name: 'In-Office Consultation', price_aud: 34221, duration_minutes: 30 }
          ]

          const finalPlans = fetchedPlans.length > 0 ? fetchedPlans : fallbackPlans

          setBookings(fetchedBookings)
          setPlans(finalPlans)
        }
      } catch (err) {
        if (!ignore) {
          console.error('Error fetching data:', err)
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [])

  function handleOpenCreateModal() {
    setFormName('')
    setFormEmail('')
    setFormPhone('')
    if (plans.length > 0) setFormPlanId(plans[0].id)
    setFormDate(new Date().toISOString().split('T')[0])
    setFormTime('10:00:00')
    setFormNotes('')
    setFormStatus('confirmed')
    setCreateError(null)
    setIsCreateModalOpen(true)
  }

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim() || !formPlanId) {
      setCreateError('Please fill in all required fields.')
      return
    }

    try {
      setIsSubmitting(true)
      setCreateError(null)
      const res = await createAdminBookingAction({
        name: formName,
        email: formEmail,
        phone: formPhone,
        planId: formPlanId,
        date: formDate,
        time: formTime,
        notes: formNotes,
        status: formStatus
      })

      if (res.booking) {
        setBookings(prev => [res.booking as Booking, ...prev])
        setIsCreateModalOpen(false)
      }
    } catch (err) {
      console.error('Error creating booking:', err)
      setCreateError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStatusChange(bookingId: string, newStatus: 'confirmed' | 'pending' | 'cancelled') {
    try {
      setIsUpdatingStatus(true)
      const res = await updateBookingStatusAction(bookingId, newStatus)
      if (res.booking) {
        const updated = res.booking as Booking
        setBookings(prev => prev.map(b => b.id === bookingId ? updated : b))
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(updated)
        }
      }
    } catch (err) {
      console.error('Error updating status:', err)
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function handleSendReminder(bookingId: string) {
    try {
      setSendingReminderId(bookingId)
      setActionSuccessMsg(null)
      const res = await sendBookingReminderAction(bookingId)
      if (res.success) {
        setActionSuccessMsg(res.message || 'Appointment reminder sent!')
      }
    } catch (err) {
      console.error('Reminder error:', err)
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setSendingReminderId(null)
    }
  }

  async function handleSendGoogleReview(bookingId: string) {
    try {
      setSendingReviewId(bookingId)
      setActionSuccessMsg(null)
      const res = await sendGoogleReviewRequestAction(bookingId)
      if (res.success) {
        setActionSuccessMsg(res.message || 'Google Review request sent!')
      }
    } catch (err) {
      console.error('Google Review error:', err)
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setSendingReviewId(null)
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
        <Loader2 className="admin-loader-icon animate-spin" />
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6">
      {/* Header Title + Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="admin-heading">Consultation Bookings</h1>
          <p className="admin-subheading">Manage scheduled client consultations, payments and appointment timelines.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all bg-[#E40229] hover:bg-[#c80224] shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Booking
        </button>
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
            <option value="all">All Statuses ({bookings.length})</option>
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
                  <th className="text-right">Actions</th>
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
                    <td className="admin-td text-right">
                      <button 
                        onClick={() => setSelectedBooking(b)}
                        className="admin-cell-primary flex items-center gap-1 text-xs ml-auto hover:underline font-bold cursor-pointer" 
                        style={{ color: 'var(--color-admin-navy)' }}
                      >
                        Details <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE BOOKING MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white border rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E40229]">
                  Admin Direct Action
                </span>
                <h3 className="text-xl font-extrabold text-gray-800 mt-0.5">
                  Create Consultation Booking
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Bar */}
            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateBooking} className="space-y-4 overflow-y-auto flex-1 pr-1 text-sm text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-600">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Client name..."
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="client@example.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+61 400 000 000"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Session Option Plan */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-600">Consultation Session Option *</label>
                  <select
                    value={formPlanId}
                    onChange={e => setFormPlanId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {plans.map(p => {
                      const priceFormatted = p.price_aud > 1000 
                        ? `$${(p.price_aud / 100).toFixed(2)} AUD` 
                        : `$${p.price_aud} AUD`
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({priceFormatted} - {p.duration_minutes} mins)
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Schedule Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Time Slot */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Time Slot *</label>
                  <select
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="09:00:00">09:00 AM</option>
                    <option value="10:00:00">10:00 AM</option>
                    <option value="11:00:00">11:00 AM</option>
                    <option value="13:00:00">01:00 PM</option>
                    <option value="14:00:00">02:00 PM</option>
                    <option value="15:00:00">03:00 PM</option>
                    <option value="16:00:00">04:00 PM</option>
                  </select>
                </div>

                {/* Initial Status */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-600">Booking Status *</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'confirmed' | 'pending' | 'cancelled')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="confirmed">Confirmed / Paid</option>
                    <option value="pending">Pending Checkout</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Client Notes */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-600">Client Notes / Case Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Enter any initial consultation notes or client requests..."
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-gray-600 hover:bg-gray-100 transition-colors font-medium text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#E40229] hover:bg-[#c80224] text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Booking'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING DETAILS MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white border rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E40229]">
                  Consultation Booking Details
                </span>
                <h3 className="text-xl font-extrabold text-gray-800 mt-0.5 flex items-center gap-2">
                  {selectedBooking.name}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold capitalize flex items-center gap-1 ${
                    selectedBooking.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedBooking.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedBooking.status}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Contents */}
            <div className="space-y-6 overflow-y-auto flex-1 pr-1 font-sans text-sm text-gray-700">
              
              {/* Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Contact Info Card */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-red-600" />
                    Contact Information
                  </h4>
                  <div className="text-xs space-y-1.5">
                    <p><span className="font-semibold text-gray-500">Email: </span><a href={`mailto:${selectedBooking.email}`} className="text-blue-600 hover:underline">{selectedBooking.email}</a></p>
                    <p><span className="font-semibold text-gray-500">Phone: </span><a href={`tel:${selectedBooking.phone}`} className="text-blue-600 hover:underline">{selectedBooking.phone || "—"}</a></p>
                    {selectedBooking.created_at && (
                      <p><span className="font-semibold text-gray-500">Submitted: </span>{format(new Date(selectedBooking.created_at), 'dd MMM yyyy, h:mm a')}</p>
                    )}
                  </div>
                </div>

                {/* Session Option Card */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-600" />
                    Appointment Schedule
                  </h4>
                  <div className="text-xs space-y-1.5">
                    <p><span className="font-semibold text-gray-500">Option: </span><span className="font-bold text-slate-800">{selectedBooking.plans?.name || "Consultation"}</span></p>
                    <p><span className="font-semibold text-gray-500">Date: </span><span className="font-bold text-red-600">{format(new Date(selectedBooking.date), 'dd MMMM yyyy')}</span></p>
                    <p><span className="font-semibold text-gray-500">Time: </span><span className="font-bold text-slate-800">{selectedBooking.time}</span></p>
                    {selectedBooking.stripe_session_id && (
                      <p className="truncate"><span className="font-semibold text-gray-500">Stripe ID: </span><span className="font-mono text-[11px] text-gray-600">{selectedBooking.stripe_session_id}</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  Client Notes &amp; Inquiry Details
                </h4>
                <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                  {selectedBooking.notes ? selectedBooking.notes : <span className="italic text-gray-400">No notes provided by client.</span>}
                </div>
              </div>

              {/* One-Click Client Email Actions */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  One-Click Client Email Actions
                </h4>

                {actionSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{actionSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Appointment Reminder Button */}
                  <button
                    disabled={!!sendingReminderId || !!sendingReviewId}
                    onClick={() => handleSendReminder(selectedBooking.id)}
                    className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {sendingReminderId === selectedBooking.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending Reminder...
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        Send Appointment Reminder
                      </>
                    )}
                  </button>

                  {/* Request Google Review Button */}
                  <button
                    disabled={!!sendingReminderId || !!sendingReviewId}
                    onClick={() => handleSendGoogleReview(selectedBooking.id)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#E40229] hover:bg-[#c80224] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {sendingReviewId === selectedBooking.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending Review Request...
                      </>
                    ) : (
                      <>
                        <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        Request Google Review
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Update Quick Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Update Booking Status
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    disabled={isUpdatingStatus || selectedBooking.status === 'confirmed'}
                    onClick={() => handleStatusChange(selectedBooking.id, 'confirmed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedBooking.status === 'confirmed'
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" /> Confirmed / Paid
                  </button>
                  <button
                    disabled={isUpdatingStatus || selectedBooking.status === 'pending'}
                    onClick={() => handleStatusChange(selectedBooking.id, 'pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedBooking.status === 'pending'
                        ? 'bg-amber-600 text-white cursor-default'
                        : 'bg-slate-800 text-slate-300 hover:bg-amber-600 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3 h-3" /> Pending Checkout
                  </button>
                  <button
                    disabled={isUpdatingStatus || selectedBooking.status === 'cancelled'}
                    onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedBooking.status === 'cancelled'
                        ? 'bg-rose-600 text-white cursor-default'
                        : 'bg-slate-800 text-slate-300 hover:bg-rose-600 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-3 h-3" /> Cancelled
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t pt-4 mt-4 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
