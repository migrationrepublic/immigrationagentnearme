"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Calendar, Save, CheckCircle2, XCircle, Lock, Phone, Video, Building2, CalendarOff, CalendarCheck } from "lucide-react"
import { getAvailabilityForDateAction, updateAvailabilityAction, getAdminPlansAction, bulkUpdateAvailabilityAction } from "@/app/actions/admin"
import { Plan } from "@/lib/types"

const defaultSlots = [
  "09:00:00", "10:00:00", "11:00:00",
  "13:00:00", "14:00:00", "15:00:00", "16:00:00",
]

// Icon + fallback plans shown while the real plans (with their DB ids) load.
// Matched to the DB row by slug so each tab manages its own availability.
const planIconBySlug: Record<string, React.ReactNode> = {
  "phone-consultation": <Phone className="w-4 h-4" />,
  "online-video-consultation": <Video className="w-4 h-4" />,
  "in-office-consultation": <Building2 className="w-4 h-4" />,
}

type SlotState = 'available' | 'blocked' | 'booked'

function addDaysToDateStr(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function ManageAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const tzDate = new Date().toLocaleString("en-US", { timeZone: "Australia/Melbourne" })
    const d = new Date(tzDate)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [slotStates, setSlotStates] = useState<Record<string, SlotState>>({})

  // Long-term (date range) block/release
  const [bulkStart, setBulkStart] = useState(() => selectedDate)
  const [bulkEnd, setBulkEnd] = useState(() => addDaysToDateStr(selectedDate, 30))
  const [bulkMode, setBulkMode] = useState<'block' | 'unblock' | null>(null)

  // Load the consultation types (Phone / Video / Office) once on mount
  useEffect(() => {
    async function loadPlans() {
      setLoadingPlans(true)
      try {
        const data = await getAdminPlansAction()
        setPlans(data as Plan[])
        if (data.length > 0) setSelectedPlanId(data[0].id)
      } catch (e) {
        console.error("Failed to load consultation types", e)
        alert("Failed to load consultation types. Make sure you are an admin.")
      } finally {
        setLoadingPlans(false)
      }
    }
    loadPlans()
  }, [])

  useEffect(() => {
    if (!selectedPlanId) return
    async function loadDate() {
      setLoading(true)
      try {
        const { blockedTimes, bookedTimes } = await getAvailabilityForDateAction(selectedDate, selectedPlanId)
        const newStates: Record<string, SlotState> = {}
        for (const slot of defaultSlots) {
          if (bookedTimes.includes(slot)) newStates[slot] = 'booked'
          else if (blockedTimes.includes(slot)) newStates[slot] = 'blocked'
          else newStates[slot] = 'available'
        }
        setSlotStates(newStates)
      } catch (e) {
        console.error("Failed to load availability", e)
        alert("Failed to load availability. Make sure you are an admin.")
      } finally {
        setLoading(false)
      }
    }
    loadDate()
  }, [selectedDate, selectedPlanId])

  const toggleSlot = (time: string) => {
    if (slotStates[time] === 'booked') return
    setSlotStates(prev => ({ ...prev, [time]: prev[time] === 'available' ? 'blocked' : 'available' }))
  }

  const handleSave = async () => {
    if (!selectedPlanId) return
    setSaving(true)
    try {
      const blockedSlots = Object.entries(slotStates)
        .filter(([, state]) => state === 'blocked')
        .map(([time]) => time)
      await updateAvailabilityAction(selectedDate, blockedSlots, selectedPlanId)
      alert("Availability saved successfully!")
    } catch (e) {
      console.error(e)
      alert("Error saving availability.")
    } finally {
      setSaving(false)
    }
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  const applyQuickRange = (days: number) => {
    setBulkStart(selectedDate)
    setBulkEnd(addDaysToDateStr(selectedDate, days))
  }

  const handleBulkAction = async (mode: 'block' | 'unblock') => {
    if (!selectedPlanId) return
    if (bulkStart > bulkEnd) {
      alert("Start date must be on or before the end date.")
      return
    }

    const planLabel = selectedPlan?.name || "this consultation type"
    const verb = mode === 'block' ? 'disable' : 're-enable'
    const confirmed = window.confirm(
      `This will ${verb} every daily time slot for ${planLabel} from ${bulkStart} to ${bulkEnd}. Continue?`
    )
    if (!confirmed) return

    setBulkMode(mode)
    try {
      const result = await bulkUpdateAvailabilityAction({
        startDate: bulkStart,
        endDate: bulkEnd,
        planId: selectedPlanId,
        mode,
      })
      alert(`${planLabel} ${verb}d across ${result.datesAffected} day(s).`)
      // Refresh the currently viewed day in case it fell inside the range
      const { blockedTimes, bookedTimes } = await getAvailabilityForDateAction(selectedDate, selectedPlanId)
      const newStates: Record<string, SlotState> = {}
      for (const slot of defaultSlots) {
        if (bookedTimes.includes(slot)) newStates[slot] = 'booked'
        else if (blockedTimes.includes(slot)) newStates[slot] = 'blocked'
        else newStates[slot] = 'available'
      }
      setSlotStates(newStates)
    } catch (e) {
      console.error(e)
      alert(`Error trying to ${verb} the date range.`)
    } finally {
      setBulkMode(null)
    }
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":")
    let h = parseInt(hours, 10)
    const ampm = h >= 12 ? "PM" : "AM"
    if (h > 12) h -= 12
    if (h === 0) h = 12
    return `${h}:${minutes} ${ampm}`
  }

  // Slot appearance map
  const slotConfig: Record<SlotState, { card: string; textClass: string; statusText: string; icon: React.ReactNode }> = {
    available: {
      card: 'border-green-200 bg-green-50 cursor-pointer hover:bg-green-100',
      textClass: 'text-green-700 font-medium',
      statusText: 'Available',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    },
    blocked: {
      card: 'border-red-200 bg-red-50 cursor-pointer hover:bg-red-100',
      textClass: 'text-red-700 font-medium',
      statusText: 'Unavailable',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
    },
    booked: {
      card: 'border-blue-200 bg-blue-50 cursor-not-allowed opacity-80',
      textClass: 'text-blue-700',
      statusText: 'Booked by Client',
      icon: <Lock className="w-5 h-5 text-blue-500" />,
    },
  }

  return (
    <div className="admin-page max-w-4xl mx-auto">
      {/* Title + save */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="admin-heading">Manage Availability</h1>
          <p className="admin-subheading">Block or release specific time slots for client consultations.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="admin-btn-primary disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </div>

      {/* Consultation type tabs — each type has its own independent availability */}
      <div className="admin-card-padded">
        <label className="admin-label block mb-3">Consultation Type</label>
        {loadingPlans ? (
          <div className="admin-loader py-4">
            <Loader2 className="admin-loader-icon" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {plans.map(plan => {
              const isActive = plan.id === selectedPlanId
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                    isActive
                      ? 'border-[var(--color-admin-accent,#012269)] bg-[var(--color-admin-accent,#012269)] text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {planIconBySlug[plan.slug ?? ''] ?? <Calendar className="w-4 h-4" />}
                  {plan.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Long-term (date range) disable / re-enable */}
      <div className="admin-card-padded">
        <label className="admin-label block mb-1">Long-Term Disable</label>
        <p className="text-xs mb-4" style={{ color: 'var(--color-admin-subtext)' }}>
          Block or release every daily time slot for {selectedPlan?.name || 'this type'} across a whole date range
          — e.g. disable it for a full month in one go, instead of blocking each day by hand.
        </p>

        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="admin-label block mb-1 text-[10px]">From</label>
            <input
              type="date"
              value={bulkStart}
              onChange={e => setBulkStart(e.target.value)}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label block mb-1 text-[10px]">To</label>
            <input
              type="date"
              value={bulkEnd}
              onChange={e => setBulkEnd(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => applyQuickRange(7)} className="px-3 py-2.5 rounded-xl border text-gray-600 hover:bg-gray-100 transition-colors font-bold text-xs">1 Week</button>
            <button type="button" onClick={() => applyQuickRange(30)} className="px-3 py-2.5 rounded-xl border text-gray-600 hover:bg-gray-100 transition-colors font-bold text-xs">1 Month</button>
            <button type="button" onClick={() => applyQuickRange(90)} className="px-3 py-2.5 rounded-xl border text-gray-600 hover:bg-gray-100 transition-colors font-bold text-xs">3 Months</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleBulkAction('block')}
            disabled={bulkMode !== null || !selectedPlanId}
            className="admin-btn-danger disabled:opacity-50"
          >
            {bulkMode === 'block' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarOff className="w-4 h-4" />}
            Disable Whole Range
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction('unblock')}
            disabled={bulkMode !== null || !selectedPlanId}
            className="px-5 py-2.5 rounded-xl border text-gray-600 hover:bg-gray-100 transition-colors font-bold text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {bulkMode === 'unblock' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
            Re-enable Whole Range
          </button>
        </div>
      </div>

      {/* Date picker card */}
      <div className="admin-card-padded">
        <label className="admin-label block mb-2">Select Date</label>
        <div className="relative max-w-xs">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-admin-muted)' }} />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
      </div>

      {/* Slots card */}
      <div className="admin-card-padded">
        {loading || loadingPlans ? (
          <div className="admin-loader py-12">
            <Loader2 className="admin-loader-icon" />
          </div>
        ) : (
          <>
            <h3 className="admin-section-title">
              Time Slots for {selectedDate}
              {selectedPlan && <> &middot; {selectedPlan.name}</>}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultSlots.map(time => {
                const state = slotStates[time] as SlotState ?? 'available'
                const cfg = slotConfig[state]
                return (
                  <div
                    key={time}
                    onClick={() => toggleSlot(time)}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${cfg.card}`}
                  >
                    <div>
                      <div className={`font-bold text-lg mb-0.5 ${cfg.textClass}`}>{formatTime(time)}</div>
                      <div className={`text-xs uppercase tracking-wider font-bold ${cfg.textClass}`}>{cfg.statusText}</div>
                    </div>
                    {cfg.icon}
                  </div>
                )
              })}
            </div>

            <div className="mt-8 pt-6 border-t flex flex-wrap gap-6 text-sm" style={{ borderColor: 'var(--color-admin-card-border)', color: 'var(--color-admin-subtext)' }}>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Available (Click to block)</div>
              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Unavailable (Click to unblock)</div>
              <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-blue-500" /> Client Booked (Cannot change)</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
