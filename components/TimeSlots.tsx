'use client'

import React from 'react'
import { Clock, AlertCircle } from 'lucide-react'

interface TimeSlotsProps {
  slots: string[]
  selectedTime: string | null
  onSelectTime: (time: string) => void
  isLoading: boolean
}

export default function TimeSlots({ slots, selectedTime, onSelectTime, isLoading }: TimeSlotsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
        ))}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-red-50/30 rounded-3xl border border-red-100">
        <AlertCircle className="w-8 h-8 text-[#e40229] mx-auto mb-3 opacity-50" />
        <p className="text-[#012269] font-black text-sm uppercase tracking-tighter">No Availability</p>
        <p className="text-gray-400 text-xs mt-1 font-medium">All slots are booked for this date.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {slots.map((time) => {
        const [hourStr, minuteStr] = time.split(':')
        let hour = parseInt(hourStr, 10)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        hour = hour % 12
        hour = hour ? hour : 12
        const formattedTime = `${hour}:${minuteStr} ${ampm}`

        const isSelected = selectedTime === time

        return (
          <button
            key={time}
            type="button"
            onClick={() => onSelectTime(time)}
            className={`
              group relative py-4 px-4 rounded-2xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 border-2
              ${isSelected 
                ? 'bg-[#012269] text-white border-[#012269] shadow-xl shadow-blue-900/10' 
                : 'bg-white text-[#012269] border-gray-100 hover:border-[#e40229]/30 hover:bg-red-50/20'
              }
            `}
          >
            <Clock className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-[#e40229]' : 'text-gray-300 group-hover:text-[#e40229]'}`} />
            {formattedTime}
            {isSelected && (
              <div className="absolute -top-1.5 -right-1.5 bg-[#e40229] text-white rounded-full p-0.5 shadow-lg">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

