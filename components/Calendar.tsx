'use client'

import React, { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isBefore, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarProps {
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
}

export default function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const [currentMonth, setCurrentMonth] = useState(tomorrow)

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-3 sm:mb-4 px-0.5 sm:px-1">
        <h2 className="text-base sm:text-lg md:text-xl font-black text-[#012269] tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-gray-100 hover:bg-gray-50 text-[#012269] transition-all active:scale-95"
            type="button"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-gray-100 hover:bg-gray-50 text-[#012269] transition-all active:scale-95"
            type="button"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const dateFormat = 'EEE'
    const days = []
    const startDate = startOfWeek(currentMonth)

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 py-1.5 sm:py-2" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      )
    }

    return <div className="grid grid-cols-7 mb-1 border-b border-gray-50">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const dateFormat = 'd'
    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ''

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat)
        const cloneDay = day
        const isSunday = day.getDay() === 0
        const isDisabledDate = isBefore(day, today) || isSunday
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isSelected = selectedDate && isSameDay(day, selectedDate)

        days.push(
          <button
            key={day.toString()}
            type="button"
            disabled={isDisabledDate || !isCurrentMonth}
            onClick={() => onSelectDate(cloneDay)}
            className={`
              group relative w-full h-9 sm:h-10 flex items-center justify-center text-xs sm:text-sm
              ${!isCurrentMonth ? 'opacity-0 cursor-not-allowed' : ''}
              ${isDisabledDate && isCurrentMonth ? 'cursor-not-allowed' : ''}
              ${!isDisabledDate && isCurrentMonth ? 'cursor-pointer' : ''}
            `}
          >
            <span
              className={`
                flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold transition-colors duration-150
                ${isSelected ? 'bg-[#e40229] text-white shadow-lg shadow-red-500/40' : ''}
                ${isDisabledDate && isCurrentMonth ? 'bg-gray-50 text-gray-300' : ''}
                ${!isDisabledDate && isCurrentMonth && !isSelected ? 'text-[#012269] group-hover:bg-blue-50 group-hover:text-[#e40229]' : ''}
              `}
            >
              {formattedDate}
            </span>
            {isSameDay(day, today) && !isSelected && isCurrentMonth && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#e40229] rounded-full" />
            )}
          </button>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7 gap-0.5 mt-0.5" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    return <div>{rows}</div>
  }

  return (
    <div className="w-full">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  )
}

