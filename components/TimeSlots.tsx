'use client'

import React from 'react'
import { Clock } from 'lucide-react'

interface TimeSlotsProps {
  slots: string[]
  selectedTime: string | null
  onSelectTime: (time: string) => void
  isLoading: boolean
}

export default function TimeSlots({ slots, selectedTime, onSelectTime, isLoading }: TimeSlotsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">No available slots for this date.</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Please select another day.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {slots.map((time) => {
        // Format time (e.g., "09:00:00" -> "9:00 AM")
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
              py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
              ${isSelected 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none border border-transparent' 
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              }
            `}
          >
            {formattedTime}
          </button>
        )
      })}
    </div>
  )
}
