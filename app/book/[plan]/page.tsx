'use client'

import React, { useState, useEffect, use } from 'react'
import { getPlan, getAvailableSlots } from '@/app/actions/booking'
import Calendar from '@/components/Calendar'
import TimeSlots from '@/components/TimeSlots'
import BookingForm from '@/components/BookingForm'
import { format } from 'date-fns'
import { ArrowLeft, Loader2, Calendar as CalendarIcon, Clock, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function BookPlanPage({ params }: { params: Promise<{ plan: string }> }) {
  const unwrappedParams = use(params)
  const planId = unwrappedParams.plan

  const [plan, setPlan] = useState<any>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const [step, setStep] = useState<1 | 2>(1) // 1: Date/Time, 2: Form

  useEffect(() => {
    async function fetchPlan() {
      const p = await getPlan(planId)
      if (p) setPlan(p)
      // Fallback for development if not in DB
      else setPlan({ id: planId, name: 'Selected Plan', price_aud: 150, duration_minutes: 45 })
      setLoadingPlan(false)
    }
    fetchPlan()
  }, [planId])

  useEffect(() => {
    if (!selectedDate) return
    async function fetchSlots() {
      setLoadingSlots(true)
      setSelectedTime(null) // Reset time when date changes
      const formattedDate = format(selectedDate!, 'yyyy-MM-dd')
      
      // Attempt to fetch from DB
      let availableSlots = await getAvailableSlots(formattedDate)
      
      // Fallback for development (generate fake slots 9am to 4pm)
      if (availableSlots.length === 0) {
        availableSlots = ['09:00:00', '10:00:00', '11:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00']
      }
      
      setSlots(availableSlots)
      setLoadingSlots(false)
    }
    fetchSlots()
  }, [selectedDate])

  if (loadingPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <h2 className="text-2xl font-bold mb-4">Plan not found</h2>
        <Link href="/pricing" className="text-blue-600 hover:underline">Return to Pricing</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/pricing" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to plans
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Book {plan.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{plan.duration_minutes} Minutes • ${plan.price_aud} AUD</p>
            </div>
            
            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step === 1 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>1</div>
              <div className="w-8 h-1 bg-gray-200 dark:bg-gray-800 rounded-full">
                <div className={`h-full bg-blue-600 rounded-full transition-all duration-300 ${step === 2 ? 'w-full' : 'w-0'}`} />
              </div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-800'}`}>2</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_350px] gap-8 items-start">
          
          {/* Main Content Area */}
          <div className="space-y-6">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    Select a Date
                  </h3>
                  <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                </div>
                
                {selectedDate && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      Available Times
                    </h3>
                    <TimeSlots 
                      slots={slots} 
                      selectedTime={selectedTime} 
                      onSelectTime={setSelectedTime} 
                      isLoading={loadingSlots} 
                    />
                  </div>
                )}

                {selectedTime && (
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                    >
                      Continue
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && selectedDate && selectedTime && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BookingForm 
                  planId={plan.id}
                  date={format(selectedDate, 'yyyy-MM-dd')}
                  time={selectedTime}
                  onBack={() => setStep(1)}
                />
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm sticky top-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Booking Summary</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Plan</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">{plan.name}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Duration</span>
                <span className="font-medium text-gray-900 dark:text-white">{plan.duration_minutes} mins</span>
              </div>

              {selectedDate && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Date</span>
                  <span className="font-medium text-gray-900 dark:text-white">{format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
              )}

              {selectedTime && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Time</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(() => {
                      const [h, m] = selectedTime.split(':');
                      let hour = parseInt(h, 10);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      hour = hour % 12 || 12;
                      return `${hour}:${m} ${ampm}`;
                    })()}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-4 mt-2">
                <span className="text-base font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-xl font-bold text-blue-600">${plan.price_aud} AUD</span>
              </div>
            </div>

            {plan.price_aud > 0 && (
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <CreditCard className="w-4 h-4" />
                Secure payment via Stripe
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
