'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { CheckCircle2, Calendar as CalendarIcon, Clock, CreditCard, ArrowRight } from 'lucide-react'
import { getCheckoutSession } from '@/app/actions/booking'

export default function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const unwrappedParams = use(searchParams)
  const sessionId = unwrappedParams.session_id
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(!!sessionId)

  useEffect(() => {
    if (sessionId) {
      getCheckoutSession(sessionId).then(data => {
        setSession(data)
        setLoading(false)
      })
    }
  }, [sessionId])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-20">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-blue-900/5 border border-blue-50 text-center relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
        
        <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
          <CheckCircle2 className="w-12 h-12 text-green-500 -rotate-3" />
        </div>

        <h1 className="text-4xl font-black text-[#012269] mb-4 tracking-tighter">Booking Confirmed!</h1>
        <p className="text-lg text-slate-500 mb-10 font-medium">
          Thank you for choosing Migration Republic. Your Australian journey just took a major step forward.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#012269]"></div>
          </div>
        ) : session && session.metadata ? (
          <div className="bg-slate-50 rounded-[2rem] p-8 mb-10 text-left border border-slate-100">
            <h3 className="text-sm font-black text-[#012269] uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="p-1.5 bg-[#012269] rounded-lg">
                <CalendarIcon className="w-4 h-4 text-white" />
              </div>
              Booking Summary
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Consultation</span>
                  <span className="font-bold text-[#012269]">{session.metadata.planName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Client Name</span>
                  <span className="font-bold text-[#012269]">{session.metadata.name}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date & Time</span>
                  <span className="font-bold text-[#e40229]">
                    {session.metadata.date} @ {session.metadata.time}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Payment Status</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-700 uppercase tracking-tighter">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    Paid Successfully
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <Link
            href="/"
            className="group w-full py-5 bg-[#012269] hover:bg-[#012269]/90 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-tighter"
          >
            Go to Homepage
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            A confirmation email has been sent to your inbox.
          </p>
        </div>
      </div>
    </div>
  )
}
