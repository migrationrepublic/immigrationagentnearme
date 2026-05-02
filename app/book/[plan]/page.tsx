"use client";

import React, { useState, useEffect, use } from "react";
import {
  getPlan,
  getPlanBySlug,
  getAvailableSlots,
} from "@/app/actions/booking";
import Calendar from "@/components/Calendar";
import TimeSlots from "@/components/TimeSlots";
import BookingForm from "@/components/BookingForm";
import { format } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BookPlanPage({
  params,
}: {
  params: Promise<{ plan: string }>;
}) {
  const unwrappedParams = use(params);
  const planId = unwrappedParams.plan;

  const [plan, setPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2>(1); // 1: Date/Time, 2: Form

  useEffect(() => {
    async function fetchPlan() {
      let p = await getPlanBySlug(planId);
      if (!p) {
        p = await getPlan(planId);
      }

      if (p) setPlan(p);
      else
        setPlan({
          id: planId,
          name: "Selected Plan",
          price_aud: 11407,
          duration_minutes: 30,
        });
      setLoadingPlan(false);
    }
    fetchPlan();
  }, [planId]);

  useEffect(() => {
    if (!selectedDate) return;
    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedTime(null);
      const formattedDate = format(selectedDate!, "yyyy-MM-dd");
      let availableSlots = await getAvailableSlots(formattedDate);

      if (availableSlots.length === 0) {
        availableSlots = [
          "09:00:00",
          "10:00:00",
          "11:00:00",
          "13:00:00",
          "14:00:00",
          "15:00:00",
          "16:00:00",
        ];
      }

      setSlots(availableSlots);
      setLoadingSlots(false);
    }
    fetchSlots();
  }, [selectedDate]);

  if (loadingPlan) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#012269]" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-black text-[#012269] mb-4">
          Plan Not Found
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          We couldn't find the consultation plan you're looking for. It may have
          been moved or removed.
        </p>
        <Link href="/pricing" className="btn-primary">
          View All Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* Header Info Section */}
      <div className="bg-[#012269] text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/logobgwhite.jpg"
              alt="Migration Republic"
              width={160}
              height={160}
              className="rounded-full border-4 border-white/20 shadow-2xl shadow-black/20"
            />
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center text-white/60 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Consultations
          </Link>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tighter text-white">
            Book Your {plan.name}
          </h1>
          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto font-medium">
            Take the first step towards your Australian dream. Expert guidance
            is just a few clicks away.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-20">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Main Booking Interface */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/5 border border-blue-50/50 p-6 md:p-10">
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-10 pb-10 border-b border-gray-100">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 ${step === 1 ? "bg-[#e40229] text-white shadow-lg shadow-[#e40229]/20 scale-110" : "bg-green-500 text-white"}`}
                >
                  {step > 1 ? <CheckCircle2 className="w-6 h-6" /> : "1"}
                </div>
                <span
                  className={`text-xs font-black uppercase tracking-tighter ${step === 1 ? "text-[#012269]" : "text-gray-400"}`}
                >
                  Select Time
                </span>
              </div>
              <div className="flex-grow h-1 mx-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-[#e40229] transition-all duration-700 ease-in-out ${step > 1 ? "w-full" : "w-0"}`}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 ${step === 2 ? "bg-[#e40229] text-white shadow-lg shadow-[#e40229]/20 scale-110" : "bg-gray-100 text-gray-400"}`}
                >
                  2
                </div>
                <span
                  className={`text-xs font-black uppercase tracking-tighter ${step === 2 ? "text-[#012269]" : "text-gray-400"}`}
                >
                  Your Details
                </span>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid md:grid-cols-1 gap-10">
                  <section>
                    <h3 className="text-xl font-black text-[#012269] mb-6 flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <CalendarIcon className="w-5 h-5 text-[#012269]" />
                      </div>
                      1. Choose a Date
                    </h3>
                    <Calendar
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                    />
                  </section>

                  {selectedDate && (
                    <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                      <h3 className="text-xl font-black text-[#012269] mb-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Clock className="w-5 h-5 text-[#012269]" />
                        </div>
                        2. Available Times for {format(selectedDate, "MMMM d")}
                        <span className="ml-2 text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">
                          Melbourne Time (AEST/AEDT)
                        </span>
                      </h3>
                      <TimeSlots
                        slots={slots}
                        selectedTime={selectedTime}
                        onSelectTime={setSelectedTime}
                        isLoading={loadingSlots}
                      />
                    </section>
                  )}
                </div>

                {selectedTime && (
                  <div className="pt-10 flex justify-center border-t border-gray-100">
                    <button
                      onClick={() => setStep(2)}
                      className="btn-primary w-full md:w-auto px-12 py-4 text-lg flex items-center justify-center gap-3 group"
                    >
                      Confirm Time & Continue
                      <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && selectedDate && selectedTime && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                <h3 className="text-2xl font-black text-[#012269] mb-8">
                  Enter Your Information
                </h3>
                <BookingForm
                  planId={plan.id}
                  date={format(selectedDate, "yyyy-MM-dd")}
                  time={selectedTime}
                  onBack={() => setStep(1)}
                />
              </div>
            )}
          </div>

          {/* Sidebar Summary & Trust */}
          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-blue-900/5">
              <h3 className="text-xl font-black text-[#012269] mb-6 border-b border-gray-100 pb-4 tracking-tight">
                Booking Summary
              </h3>

              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                    Consultation
                  </span>
                  <span className="font-black text-[#012269] text-right max-w-[200px]">
                    {plan.name}
                  </span>
                </div>

                {plan.slug === "in-office-consultation" && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                      Address
                    </span>
                    <span className="font-black text-[#012269] text-right text-xs max-w-[180px]">
                      470 St Kilda Rd, Melbourne VIC 3004
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                    Time Limit
                  </span>
                  <span className="font-black text-[#012269]">
                    {plan.duration_minutes} Minutes
                  </span>
                </div>

                {selectedDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                      Date
                    </span>
                    <span className="font-black text-[#012269]">
                      {format(selectedDate, "MMMM d, yyyy")}
                    </span>
                  </div>
                )}

                {selectedTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                      Selected Time
                    </span>
                    <span className="font-black text-[#e40229]">
                      {(() => {
                        const [h, m] = selectedTime.split(":");
                        let hour = parseInt(h, 10);
                        const ampm = hour >= 12 ? "PM" : "AM";
                        hour = hour % 12 || 12;
                        return `${hour}:${m} ${ampm}`;
                      })()}
                    </span>
                  </div>
                )}

                <div className="pt-6 mt-6 border-t border-gray-100 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                      Total Amount
                    </span>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                      ${Math.round(plan.price_aud / 114.07)} + GST
                    </span>
                  </div>

                  <span className="text-3xl font-black text-[#012269]">
                    ${(plan.price_aud / 100).toFixed(2)}
                    <span className="text-sm text-gray-400 ml-1">AUD</span>
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight leading-relaxed">
                  Includes Card Surcharge
                </span>
              </div>

              <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl flex items-center gap-4 border border-blue-100">
                <ShieldCheck className="w-8 h-8 text-[#012269]" />
                <div className="text-[10px] leading-tight font-bold text-[#012269] uppercase tracking-wider">
                  MARA Registered Agent
                  <br />
                  <span className="text-[#e40229]">Secured</span>
                </div>
              </div>
            </div>

            {/* Additional Trust Signal */}
            <div className="bg-[#012269] rounded-3xl p-6 text-white overflow-hidden relative group">
              <div className="relative z-10">
                <p className="text-sm font-bold opacity-90 mb-2 italic leading-relaxed">
                  "At Migration Republic, we strive to help make your Australian
                  dream a reality."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#e40229] rounded-full" />
                  <span className="text-xs font-black uppercase tracking-tighter">
                    Migration Republic
                  </span>
                </div>
              </div>
              <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform duration-700" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
