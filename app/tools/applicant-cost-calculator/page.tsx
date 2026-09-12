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
  User,
  Loader2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Minus
} from 'lucide-react';

function fmt(n: number) {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const MAX_FAMILY_MEMBERS = 50;
const APPLICANTS = 1; // Fixed — this tool always prices a single applicant.

export default function ApplicantCostCalculatorPage() {
  const [step, setStep] = useState(1);
  const [visa, setVisa] = useState<'482' | '186' | '494'>('482');
  const [adults, setAdults] = useState<number>(0);
  const [children, setChildren] = useState<number>(0);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 2 question steps: Visa, Family. Duration of stay doesn't affect the
  // visa application charge, so it isn't asked here.
  const totalQuestions = 2;
  const progress = Math.min(100, (step / totalQuestions) * 100);

  // Applicant Cost Calculator only ever prices a single, fixed applicant plus their family.
  // Turnover and years don't affect the visa application charge, so we pass fixed values —
  // they only feed the shared calculator's (unused, in this tool) company-cost fields.
  const calculation: CostCalculationBreakdown = calculateSponsorshipCosts({
    visa,
    turnover: 'small',
    workers: APPLICANTS,
    adults,
    children,
  });

  const applicantTotal = calculation.vacPrimaryTotal;
  const adultsTotal = adults * calculation.vacAdultRate;
  const childrenTotal = children * calculation.vacChildRate;
  const totalVisaCharges = applicantTotal + adultsTotal + childrenTotal;

  const handleNext = () => {
    if (step < totalQuestions) {
      setStep(step + 1);
    } else {
      setStep(totalQuestions + 1); // Lead capture step
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetTool = () => {
    setStep(1);
    setVisa('482');
    setAdults(0);
    setChildren(0);
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
    const userEmail = formData.get('email') as string;
    const userPhone = formData.get('phone') as string;

    const leadPayload = {
      tool_name: "Applicant Cost Calculator",
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
      results: {
        visa_subclass: calculation.visaLabel,
        accompanying_family: `${adults} adult(s) (18+), ${children} child(ren) (<18)`,
        applicant_visa_charge: fmt(applicantTotal),
        family_visa_charge_adults: adults > 0 ? fmt(adultsTotal) : 'N/A',
        family_visa_charge_children: children > 0 ? fmt(childrenTotal) : 'N/A',
        total_visa_application_charges: fmt(totalVisaCharges),
      }
    };

    const res = await submitToolLead(leadPayload);

    if (res.success) {
      setSubmitted(true);
      setStep(totalQuestions + 2); // Final results screen
    } else {
      setErrorMsg(res.error || "Failed to save details. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20" suppressHydrationWarning>
      <ToolHeader
        badge="Visa Application Charges"
        title="Applicant Cost Estimator"
        description="Applicant visa application charges only — company sponsorship charges are calculated separately."
      />

      <div className="max-w-3xl mx-auto px-3 sm:px-6">
        {/* Progress Bar (For question steps 1 to 2) */}
        {step <= totalQuestions && (
          <div className="mb-5 sm:mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                Question {step} of {totalQuestions}
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
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden min-h-[360px] flex flex-col">
          <div className="p-4 sm:p-8 flex-1">

            {/* STEP 1: Visa Subclass */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <User className="w-4 h-4" /> Visa Subclass
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Visa subclass
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Select the visa subclass the applicant is applying under.
                </p>

                <div className="grid gap-3">
                  {[
                    { id: '482', label: '482 — Skills in Demand', desc: 'Temporary employer-sponsored visa for up to 4 years.' },
                    { id: '186', label: '186 — Employer Nomination Scheme', desc: 'Direct Permanent Residency pathway.' },
                    { id: '494', label: '494 — Regional', desc: 'Provisional regional visa with pathway to PR.' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVisa(item.id as '482' | '186' | '494')}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${visa === item.id
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                        }`}
                    >
                      <div>
                        <div className="text-sm sm:text-base font-bold">{item.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                      </div>
                      {visa === item.id && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Accompanying Family */}
            {step === 2 && (
              <div className="animate-fadeIn space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                    Accompanying family members
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Family members accompanying the applicant (leave 0 if none).
                  </p>
                </div>

                {/* Applicant — fixed at 1, not editable */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 flex items-center justify-between opacity-90">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Applicant</div>
                    <div className="text-xs text-gray-500">${FEES[visa].vacPrimary.toLocaleString()} VAC — fixed at 1 for this tool</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-bold text-lg text-brand-primary">{APPLICANTS}</span>
                  </div>
                </div>

                {/* Adults 18+ */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Accompanying family — adults (18+)</div>
                    <div className="text-xs text-gray-500">${FEES[visa].vacAdult.toLocaleString()} VAC each</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAdults(Math.max(0, adults - 1))}
                      disabled={adults <= 0}
                      className="w-9 h-9 rounded-lg bg-white border border-gray-300 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-100 disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-lg text-brand-primary">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults(Math.min(MAX_FAMILY_MEMBERS, adults + 1))}
                      disabled={adults >= MAX_FAMILY_MEMBERS}
                      className="w-9 h-9 rounded-lg bg-white border border-gray-300 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-100 disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Children under 18 */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Accompanying family — children (under 18)</div>
                    <div className="text-xs text-gray-500">${FEES[visa].vacChild.toLocaleString()} VAC each</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      disabled={children <= 0}
                      className="w-9 h-9 rounded-lg bg-white border border-gray-300 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-100 disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-lg text-brand-primary">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren(Math.min(MAX_FAMILY_MEMBERS, children + 1))}
                      disabled={children >= MAX_FAMILY_MEMBERS}
                      className="w-9 h-9 rounded-lg bg-white border border-gray-300 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-100 disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Lead Capture Gating */}
            {step === 3 && (
              <div className="animate-fadeIn space-y-4">
                <div className="border-b pb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-brand-primary">See the full breakdown and next steps</h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Enter your details to reveal the complete itemised visa application charge estimate.</p>
                </div>

                <form onSubmit={handleLeadFormSubmit} className="space-y-3.5 pt-1">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Your name *</label>
                      <input
                        name="name"
                        placeholder="e.g. David Miller"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-base sm:text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Email *</label>
                      <input
                        name="email"
                        type="email"
                        placeholder="david@example.com"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-base sm:text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Phone *</label>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="0400 000 000"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-base sm:text-sm bg-white"
                    />
                  </div>

                  {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#012269] hover:bg-[#012269]/90 text-white py-4 text-sm sm:text-base font-bold shadow-md rounded-xl active:scale-[0.99] transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Show my full results"}
                  </Button>
                </form>
              </div>
            )}

            {/* STEP 4: Final Itemised Results Screen */}
            {step === 4 && submitted && (
              <div className="space-y-6 animate-fadeIn">
                {/* Result Card Header */}
                <div className="card-header border-b pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-brand-primary">
                    Estimated applicant visa charges — {calculation.visaLabel}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    1 applicant, {adults} adult dependant{adults !== 1 ? 's' : ''}, {children} child dependant{children !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs overflow-x-auto">
                    <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-brand-soft/60 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-brand-primary">Applicant cost</span>
                      <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">Visa application charges — applicant &amp; family</span>
                    </div>
                    <table className="w-full text-xs sm:text-sm text-left">
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-gray-800">
                            Visa application charge — applicant
                          </td>
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                            {fmt(applicantTotal)}
                          </td>
                        </tr>
                        {adults > 0 && (
                          <tr>
                            <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-gray-800">
                              Visa application charge — accompanying family ({adults} adult{adults !== 1 ? 's' : ''})
                            </td>
                            <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                              {fmt(adultsTotal)}
                            </td>
                          </tr>
                        )}
                        {children > 0 && (
                          <tr>
                            <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-gray-800">
                              Visa application charge — accompanying family ({children} child{children !== 1 ? 'ren' : ''})
                            </td>
                            <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                              {fmt(childrenTotal)}
                            </td>
                          </tr>
                        )}
                        {adults === 0 && children === 0 && (
                          <tr>
                            <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-gray-800">
                              Visa application charge — accompanying family
                            </td>
                            <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                              {fmt(0)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-50/80 font-bold">
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-brand-primary">Applicant cost subtotal</td>
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 text-right text-brand-primary whitespace-nowrap">
                            {fmt(totalVisaCharges)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Grand Total */}
                  <div className="rounded-2xl border-2 border-brand-primary bg-brand-soft/80 px-4 sm:px-6 py-4 flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-brand-primary">Total visa application charges</span>
                    <span className="text-lg sm:text-xl font-black text-brand-primary whitespace-nowrap">
                      {fmt(totalVisaCharges)}
                    </span>
                  </div>
                </div>

                {/* CTA Row */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-md">
                    This covers the applicant&apos;s visa application charges only. Company sponsorship charges (nomination fee, SAF levy) are calculated separately.
                  </p>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={resetTool}
                      className="flex items-center gap-1.5 rounded-xl text-xs font-semibold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Start Over
                    </Button>
                    <Link
                      href="https://migrationrepublic.com.au/book-a-consultation/"
                      className="bg-[#012269] hover:bg-[#012269]/90 text-white font-bold px-6 py-2.5 rounded-xl text-center text-xs tracking-wide shadow-md flex-1 sm:flex-initial"
                    >
                      Get a personalised quote
                    </Link>
                  </div>
                </div>

                <ToolDisclaimer
                  customText="Figures are current as verified in July 2026 per the Department of Home Affairs fee schedule and are typically indexed around 1 July each year. We'll confirm the exact charges that apply before you commit to anything."
                  extraClause={calculation.waiverNote || undefined}
                />
              </div>
            )}

          </div>

          {/* Footer Navigation (For question steps 1 to 2) */}
          {step <= totalQuestions && (
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
