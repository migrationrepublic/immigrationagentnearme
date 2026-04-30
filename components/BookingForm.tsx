'use client'

import React, { useState } from 'react'
import { createCheckoutSession } from '@/app/actions/booking'
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react'

interface BookingFormProps {
  planId: string
  date: string
  time: string
  onBack: () => void
}

export default function BookingForm({ planId, date, time, onBack }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const notes = formData.get('notes') as string

    try {
      const result = await createCheckoutSession({
        planId,
        date,
        time,
        name,
        email,
        phone,
        notes,
      })

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
      } else if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-[#e40229] rounded-2xl text-sm font-bold flex items-center gap-3">
          <div className="bg-[#e40229] text-white p-1 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Your Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#012269] focus:ring-4 focus:ring-blue-900/5 outline-none transition-all text-[#012269] font-bold placeholder:text-gray-300"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#012269] focus:ring-4 focus:ring-blue-900/5 outline-none transition-all text-[#012269] font-bold placeholder:text-gray-300"
              placeholder="+61 400 000 000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#012269] focus:ring-4 focus:ring-blue-900/5 outline-none transition-all text-[#012269] font-bold placeholder:text-gray-300"
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
            Tell us about your visa case (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#012269] focus:ring-4 focus:ring-blue-900/5 outline-none transition-all text-[#012269] font-bold placeholder:text-gray-300 resize-none"
            placeholder="E.g. I need help with my Partner Visa application..."
          ></textarea>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-4 rounded-2xl font-black text-[#012269] bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 py-4 text-lg uppercase tracking-tighter flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Securing Your Spot...
              </>
            ) : (
              <>
                Secure Booking & Pay
                <ShieldCheck className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
        
        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4">
          By clicking pay, you agree to our terms of service and privacy policy.
        </p>
      </form>
    </div>
  )
}

