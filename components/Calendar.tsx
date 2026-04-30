'use client'

import React, { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isBefore, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarProps {
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
}

export default function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-8 px-2">
        <h2 className="text-xl font-black text-[#012269] tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-[#012269] transition-all active:scale-95"
            type="button"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-[#012269] transition-all active:scale-95"
            type="button"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const dateFormat = 'EEE'
    const days = []
    let startDate = startOfWeek(currentMonth)

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 py-3" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      )
    }

    return <div className="grid grid-cols-7 mb-2 border-b border-gray-50">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const today = startOfDay(new Date())

    const dateFormat = 'd'
    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ''

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat)
        const cloneDay = day
        const isPast = isBefore(day, today)
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isSelected = selectedDate && isSameDay(day, selectedDate)

        days.push(
          <button
            key={day.toString()}
            type="button"
            disabled={isPast || !isCurrentMonth}
            onClick={() => onSelectDate(cloneDay)}
            className={`
              relative p-2 w-full aspect-square flex items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300
              ${!isCurrentMonth ? 'text-gray-200 cursor-not-allowed opacity-0' : ''}
              ${isPast && isCurrentMonth ? 'text-gray-300 cursor-not-allowed bg-gray-50/50' : ''}
              ${!isPast && isCurrentMonth && !isSelected ? 'text-[#012269] hover:bg-blue-50 hover:text-[#e40229] cursor-pointer' : ''}
              ${isSelected ? 'bg-[#e40229] text-white shadow-lg shadow-[#e40229]/20 transform scale-110 z-10' : ''}
            `}
          >
            <span>{formattedDate}</span>
            {isSameDay(day, today) && !isSelected && isCurrentMonth && (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#e40229] rounded-full" />
            )}
          </button>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7 gap-2 mt-2" key={day.toString()}>
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

