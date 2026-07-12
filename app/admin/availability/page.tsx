"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Calendar, Save, CheckCircle2, XCircle, Lock } from "lucide-react"
import { getAvailabilityForDateAction, updateAvailabilityAction } from "@/app/actions/admin"

const defaultSlots = [
  "09:00:00", "10:00:00", "11:00:00",
  "13:00:00", "14:00:00", "15:00:00", "16:00:00",
]

type SlotState = 'available' | 'blocked' | 'booked'

export default function ManageAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const tzDate = new Date().toLocaleString("en-US", { timeZone: "Australia/Melbourne" })
    const d = new Date(tzDate)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [slotStates, setSlotStates] = useState<Record<string, SlotState>>({})

  useEffect(() => {
    async function loadDate() {
      setLoading(true)
      try {
        const { blockedTimes, bookedTimes } = await getAvailabilityForDateAction(selectedDate)
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
  }, [selectedDate])

  const toggleSlot = (time: string) => {
    if (slotStates[time] === 'booked') return
    setSlotStates(prev => ({ ...prev, [time]: prev[time] === 'available' ? 'blocked' : 'available' }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const blockedSlots = Object.entries(slotStates)
        .filter(([, state]) => state === 'blocked')
        .map(([time]) => time)
      await updateAvailabilityAction(selectedDate, blockedSlots)
      alert("Availability saved successfully!")
    } catch (e) {
      console.error(e)
      alert("Error saving availability.")
    } finally {
      setSaving(false)
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
        {loading ? (
          <div className="admin-loader py-12">
            <Loader2 className="admin-loader-icon" />
          </div>
        ) : (
          <>
            <h3 className="admin-section-title">Time Slots for {selectedDate}</h3>

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
