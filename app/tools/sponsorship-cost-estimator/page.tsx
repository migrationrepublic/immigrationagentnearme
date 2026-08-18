"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ToolHeader } from '@/components/tools/shared/tool-header';
import { ToolDisclaimer } from '@/components/tools/shared/tool-disclaimer';
import { Button } from '@/components/ui/button';
import { submitToolLead } from '@/app/actions/tools';
import {
  calculateSponsorshipCosts,
  FEES,
  CostCalculationBreakdown
} from '@/lib/tools/sponsorship-calculator-data';
import {
  Users,
  Building,
  Calendar,
  Loader2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Info,
  Check,
  Plus,
  Minus,
  FileSpreadsheet
} from 'lucide-react';

export default function SponsorshipCostEstimatorPage() {
  const [step, setStep] = useState(1);
  const [visa, setVisa] = useState<'482' | '186' | '494'>('482');
  const [turnover, setTurnover] = useState<'under_10m' | '10m_or_more'>('under_10m');
  const [numWorkers, setNumWorkers] = useState<number>(1);
  const [yearsOfStay, setYearsOfStay] = useState<number>(4);
  const [adults18Plus, setAdults18Plus] = useState<number>(0);
  const [childrenUnder18, setChildrenUnder18] = useState<number>(0);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If 482: 5 question steps (Subclass, Turnover, Workers, Years of Stay, Family).
  // If 186/494: 4 question steps (Years of stay skipped).
  const is482 = visa === '482';
  const totalQuestions = is482 ? 5 : 4;
  const progress = Math.min(100, (step / totalQuestions) * 100);

  const calculation: CostCalculationBreakdown = calculateSponsorshipCosts({
    visa,
    turnover,
    numWorkers,
    yearsOfStay,
    adults18Plus,
    childrenUnder18,
  });

  const handleNext = () => {
    // If not 482 and moving from step 3 (Workers), skip step 4 (Years of stay) to step 5 (Family)
    if (!is482 && step === 3) {
      setStep(5);
      return;
    }

    if (step < 5) {
      setStep(step + 1);
    } else {
      setStep(6); // Lead capture step
    }
  };

  const handleBack = () => {
    // If not 482 and moving back from step 5 (Family), jump to step 3 (Workers)
    if (!is482 && step === 5) {
      setStep(3);
      return;
    }

    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetTool = () => {
    setStep(1);
    setVisa('482');
    setTurnover('under_10m');
    setNumWorkers(1);
    setYearsOfStay(4);
    setAdults18Plus(0);
    setChildrenUnder18(0);
    setSubmitted(false);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLeadFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const userName = formData.get('name') as string;
    const businessName = formData.get('business_name') as string;
    const userEmail = formData.get('email') as string;
    const userPhone = formData.get('phone') as string;

    const leadPayload = {
      tool_name: "Sponsorship Cost Estimator",
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
      results: {
        business_name: businessName || 'N/A',
        visa_subclass: `Subclass ${visa} - ${FEES[visa].name}`,
        business_turnover: turnover === 'under_10m' ? 'Under $10 Million (Small Business)' : '$10 Million or More (Large Business)',
        number_of_workers: numWorkers,
        years_of_stay: visa === '482' ? `${yearsOfStay} Years` : 'N/A (One-off Permanent/Provisional)',
        accompanying_family: `${adults18Plus} Adult(s) 18+, ${childrenUnder18} Child(ren) <18`,
        nomination_fees_total: `$${calculation.totalNominationFees.toLocaleString()} AUD`,
        saf_levy_total: `$${calculation.totalSafLevy.toLocaleString()} AUD`,
        primary_vac_total: `$${calculation.totalPrimaryVac.toLocaleString()} AUD`,
        family_vac_total: `$${calculation.familyTotal.toLocaleString()} AUD`,
        grand_total_government_charges: `$${calculation.grandTotal.toLocaleString()} AUD`,
        itemised_breakdown: {
          nomination_per_worker: `$${calculation.nominationFeePerWorker.toLocaleString()}`,
          saf_levy_rate: `$${calculation.safLevyRatePerWorker.toLocaleString()}`,
          primary_vac_per_worker: `$${calculation.primaryVacPerWorker.toLocaleString()}`,
          adult_vac_rate: `$${calculation.adultVacRate.toLocaleString()}`,
          child_vac_rate: `$${calculation.childVacRate.toLocaleString()}`,
        }
      }
    };

    const res = await submitToolLead(leadPayload);

    if (res.success) {
      setSubmitted(true);
      setStep(7); // Final itemised results screen
    } else {
      setErrorMsg(res.error || "Failed to save details. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20" suppressHydrationWarning>
      <ToolHeader
        badge="Government Fees"
        title="Sponsorship Cost Estimator"
        description="Calculate exact Department of Home Affairs statutory charges, nomination fees, SAF levies, and visa application charges for your business."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Progress Bar (For question steps 1 to 5) */}
        {step <= 5 && (
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                Step {is482 ? step : (step === 5 ? 4 : step)} of {totalQuestions}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-accent transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden min-h-[420px] flex flex-col">
          <div className="p-5 sm:p-8 flex-1">

            {/* STEP 1: Visa Subclass */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Building className="w-4 h-4" /> Visa Program
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Which visa subclass do you intend to nominate workers for?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Select the visa category to apply the exact Department of Home Affairs statutory schedule and SAF levy structure.
                </p>

                <div className="grid gap-3">
                  {[
                    { id: '482', title: 'Subclass 482 — Skills in Demand', type: 'Temporary Employer Sponsored', desc: 'Up to 4 years duration. SAF levy charged per year upfront.' },
                    { id: '186', title: 'Subclass 186 — Employer Nomination Scheme', type: 'Direct Permanent Residency', desc: 'Direct entry PR visa. One-off flat SAF levy rate.' },
                    { id: '494', title: 'Subclass 494 — Regional Employer Sponsored', type: 'Provisional Regional Visa', desc: '5-year provisional visa with pathway to PR (Subclass 191). Nil nomination fee.' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVisa(item.id as '482' | '186' | '494')}
                      className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                        visa === item.id
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm sm:text-base">{item.title}</div>
                        <div className="text-xs font-semibold text-brand-accent mt-0.5">{item.type}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                      </div>
                      {visa === item.id && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Business Turnover */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Building className="w-4 h-4" /> Business Turnover Tier
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  What is your business annual turnover?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Determines the Skilling Australians Fund (SAF) levy rate payable to the Department of Home Affairs.
                </p>

                <div className="grid gap-3">
                  {[
                    {
                      id: 'under_10m',
                      title: 'Under $10 Million (Small Business)',
                      safNote: is482 ? '$1,200 per nomination year' : '$3,000 one-off flat levy',
                      desc: 'Eligible for small business concession SAF levy rate'
                    },
                    {
                      id: '10m_or_more',
                      title: '$10 Million or More (Large Business)',
                      safNote: is482 ? '$1,800 per nomination year' : '$5,000 one-off flat levy',
                      desc: 'Standard corporate SAF levy rate applies'
                    }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTurnover(item.id as 'under_10m' | '10m_or_more')}
                      className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                        turnover === item.id
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm sm:text-base">{item.title}</div>
                        <div className="text-xs font-semibold text-brand-accent mt-0.5">{item.safNote}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                      </div>
                      {turnover === item.id && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Number of Workers */}
            {step === 3 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Users className="w-4 h-4" /> Nominated Workers
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  How many overseas skilled workers do you plan to sponsor?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Select or enter the total number of primary applicants you are nominating.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4 p-6 bg-slate-50 rounded-2xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setNumWorkers(Math.max(1, numWorkers - 1))}
                      className="w-12 h-12 rounded-xl bg-white border border-gray-300 flex items-center justify-center font-bold text-lg hover:bg-gray-100 active:scale-95 transition-all shadow-xs"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <div className="text-center px-6">
                      <span className="text-3xl sm:text-4xl font-extrabold text-brand-primary block">{numWorkers}</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {numWorkers === 1 ? 'Primary Worker' : 'Primary Workers'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNumWorkers(Math.min(50, numWorkers + 1))}
                      className="w-12 h-12 rounded-xl bg-white border border-gray-300 flex items-center justify-center font-bold text-lg hover:bg-gray-100 active:scale-95 transition-all shadow-xs"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {[1, 2, 3, 5, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setNumWorkers(count)}
                        className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                          numWorkers === count
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {count} {count === 1 ? 'Worker' : 'Workers'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Years of Stay (Subclass 482 only) */}
            {step === 4 && is482 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Calendar className="w-4 h-4" /> Visa Duration
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  How many years of stay are requested for the Subclass 482 visa?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  The SAF levy for Subclass 482 is calculated per year upfront (e.g. 4 years at ${turnover === 'under_10m' ? '1,200' : '1,800'}/year = ${turnover === 'under_10m' ? '4,800' : '7,200'} per worker).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setYearsOfStay(year)}
                      className={`p-5 rounded-2xl border-2 text-center transition-all ${
                        yearsOfStay === year
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl font-black mb-1">{year}</div>
                      <div className="text-xs font-semibold">{year === 1 ? 'Year' : 'Years'}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{year === 4 ? 'Standard Max' : ''}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Accompanying Family Dependants */}
            {step === 5 && (
              <div className="animate-fadeIn space-y-4">
                <div className="flex items-center gap-2 mb-1 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Users className="w-4 h-4" /> Family Members
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Will accompanying family dependants be included?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">
                  Include spouses, partners, and children who will be attached to the nomination applications.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Adults 18+ */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200">
                    <div className="font-bold text-sm text-brand-primary mb-1">Accompanying Adults (18+)</div>
                    <div className="text-xs text-gray-500 mb-3">Spouses, de facto partners, or adult dependants</div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setAdults18Plus(Math.max(0, adults18Plus - 1))}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-300 flex items-center justify-center font-bold hover:bg-gray-100 active:scale-95 shadow-xs"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-2xl font-bold text-brand-primary">{adults18Plus}</span>
                      <button
                        type="button"
                        onClick={() => setAdults18Plus(adults18Plus + 1)}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-300 flex items-center justify-center font-bold hover:bg-gray-100 active:scale-95 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Children Under 18 */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200">
                    <div className="font-bold text-sm text-brand-primary mb-1">Children (Under 18)</div>
                    <div className="text-xs text-gray-500 mb-3">Dependent minor children</div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setChildrenUnder18(Math.max(0, childrenUnder18 - 1))}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-300 flex items-center justify-center font-bold hover:bg-gray-100 active:scale-95 shadow-xs"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-2xl font-bold text-brand-primary">{childrenUnder18}</span>
                      <button
                        type="button"
                        onClick={() => setChildrenUnder18(childrenUnder18 + 1)}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-300 flex items-center justify-center font-bold hover:bg-gray-100 active:scale-95 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                  <span>Total family charges: <strong>${calculation.familyTotal.toLocaleString()} AUD</strong></span>
                  <button
                    type="button"
                    onClick={() => { setAdults18Plus(0); setChildrenUnder18(0); }}
                    className="text-brand-accent hover:underline font-bold text-xs"
                  >
                    Clear Family
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Lead Form Gating */}
            {step === 6 && (
              <div className="animate-fadeIn space-y-4">
                {/* Live Estimate Headline */}
                <div className="p-5 bg-brand-primary text-white rounded-2xl text-center shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-soft/80">Estimated Statutory Total</span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                    ${calculation.grandTotal.toLocaleString()} <span className="text-sm font-semibold text-brand-soft/70">AUD</span>
                  </div>
                  <p className="text-xs text-brand-soft/80 mt-1">
                    Includes Nomination Fees, SAF Levies, Primary &amp; Family Visa Application Charges
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 font-semibold leading-relaxed">
                    Please enter your business contact details below to instantly view your full itemised government fee schedule &amp; potential waiver analysis.
                  </p>
                </div>

                <form onSubmit={handleLeadFormSubmit} className="space-y-3.5 pt-1">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Your Full Name *</label>
                      <input
                        name="name"
                        placeholder="e.g. David Miller"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Business / Company Name *</label>
                      <input
                        name="business_name"
                        placeholder="e.g. Miller Logistics Pty Ltd"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Work Email Address *</label>
                      <input
                        name="email"
                        type="email"
                        placeholder="david@millerlogistics.com.au"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Contact Number *</label>
                      <input
                        name="phone"
                        type="tel"
                        placeholder="0400 000 000"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
                      />
                    </div>
                  </div>

                  {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#e40229] hover:bg-[#e40229]/95 text-white py-4 text-sm sm:text-base font-bold shadow-md rounded-xl active:scale-[0.99] transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Unlock Full Itemised Fee Schedule"}
                  </Button>
                </form>
              </div>
            )}

            {/* STEP 7: Final Itemised Results Screen */}
            {step === 7 && submitted && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <h4 className="font-bold text-green-900 text-sm sm:text-base">Thank you! Your fee estimate has been generated.</h4>
                  <p className="text-green-700 text-xs mt-0.5">Below is your complete itemised Department of Home Affairs statutory schedule:</p>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-gray-500 font-semibold block">Nomination Fees</span>
                    <span className="text-lg font-bold text-brand-primary mt-1 block">${calculation.totalNominationFees.toLocaleString()}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-gray-500 font-semibold block">SAF Training Levy</span>
                    <span className="text-lg font-bold text-brand-primary mt-1 block">${calculation.totalSafLevy.toLocaleString()}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-gray-500 font-semibold block">Primary VACs</span>
                    <span className="text-lg font-bold text-brand-primary mt-1 block">${calculation.totalPrimaryVac.toLocaleString()}</span>
                  </div>

                  <div className="p-3.5 bg-brand-primary text-white rounded-xl">
                    <span className="text-[11px] text-brand-soft/80 font-semibold block">Grand Total AUD</span>
                    <span className="text-lg font-black text-white mt-1 block">${calculation.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Full Itemised Table */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Fee Component</th>
                        <th className="px-4 py-3">Unit Rate</th>
                        <th className="px-4 py-3">Qty / Factor</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-brand-primary">Nomination Fee</td>
                        <td className="px-4 py-3 text-gray-600">${calculation.nominationFeePerWorker.toLocaleString()} AUD</td>
                        <td className="px-4 py-3 text-gray-600">{numWorkers} worker(s)</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-primary">${calculation.totalNominationFees.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-brand-primary">Skilling Australians Fund (SAF) Levy</td>
                        <td className="px-4 py-3 text-gray-600">${calculation.safLevyRatePerWorker.toLocaleString()} AUD/yr</td>
                        <td className="px-4 py-3 text-gray-600">{numWorkers} worker(s) {is482 ? `× ${yearsOfStay} yrs` : '(flat)'}</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-primary">${calculation.totalSafLevy.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-brand-primary">Primary Visa Application Charge (VAC)</td>
                        <td className="px-4 py-3 text-gray-600">${calculation.primaryVacPerWorker.toLocaleString()} AUD</td>
                        <td className="px-4 py-3 text-gray-600">{numWorkers} worker(s)</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-primary">${calculation.totalPrimaryVac.toLocaleString()}</td>
                      </tr>
                      {adults18Plus > 0 && (
                        <tr>
                          <td className="px-4 py-3 font-semibold text-brand-primary">Accompanying Adults (18+) VAC</td>
                          <td className="px-4 py-3 text-gray-600">${calculation.adultVacRate.toLocaleString()} AUD</td>
                          <td className="px-4 py-3 text-gray-600">{adults18Plus} adult(s)</td>
                          <td className="px-4 py-3 text-right font-bold text-brand-primary">${(adults18Plus * calculation.adultVacRate).toLocaleString()}</td>
                        </tr>
                      )}
                      {childrenUnder18 > 0 && (
                        <tr>
                          <td className="px-4 py-3 font-semibold text-brand-primary">Accompanying Children (&lt;18) VAC</td>
                          <td className="px-4 py-3 text-gray-600">${calculation.childVacRate.toLocaleString()} AUD</td>
                          <td className="px-4 py-3 text-gray-600">{childrenUnder18} child(ren)</td>
                          <td className="px-4 py-3 text-right font-bold text-brand-primary">${(childrenUnder18 * calculation.childVacRate).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Actions & Next Steps */}
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={resetTool}
                    className="flex items-center gap-2 w-full sm:w-auto justify-center rounded-xl text-xs font-semibold"
                  >
                    <RotateCcw className="w-4 h-4" /> Start Over
                  </Button>
                  <Link
                    href="https://migrationrepublic.com.au/book-a-consultation/"
                    className="bg-[#e40229] hover:bg-[#e40229]/95 text-white font-bold px-6 py-2.5 rounded-xl text-center text-sm w-full sm:w-auto shadow-md"
                  >
                    Book Corporate Consultation
                  </Link>
                </div>

                <ToolDisclaimer
                  customText="Figures are current per the Department of Home Affairs fee schedule and are typically indexed around 1 July each year. We’ll confirm the exact charges that apply to your nomination before you commit to anything."
                  extraClause={visa === '186' ? "* For Subclass 186 nominations: Some regional or labour agreement nominations may qualify for a nomination fee waiver — our agents will check this during your assessment." : undefined}
                />
              </div>
            )}

          </div>

          {/* Footer Navigation (For steps 1 to 5) */}
          {step <= 5 && (
            <div className="px-4 sm:px-8 py-3.5 sm:py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
                className="text-gray-500 hover:text-brand-primary disabled:opacity-0 text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                className="bg-[#012269] hover:bg-[#012269]/95 text-white font-bold px-6 py-2 rounded-xl text-xs tracking-wider flex items-center justify-center min-w-[100px]"
              >
                Next <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
