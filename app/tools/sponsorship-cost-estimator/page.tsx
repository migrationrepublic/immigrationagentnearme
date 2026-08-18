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
  Building,
  Calendar,
  Loader2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Minus,
  FileSpreadsheet
} from 'lucide-react';

function fmt(n: number) {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function SponsorshipCostEstimatorPage() {
  const [step, setStep] = useState(1);
  const [visa, setVisa] = useState<'482' | '186' | '494'>('482');
  const [turnover, setTurnover] = useState<'small' | 'large'>('small');
  const [workers, setWorkers] = useState<number>(1);
  const [years, setYears] = useState<number>(4);
  const [adults, setAdults] = useState<number>(0);
  const [children, setChildren] = useState<number>(0);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If 482: 5 question steps (Visa, Turnover, Workers, Years, Family).
  // If 186/494: 4 question steps (Years skipped).
  const is482 = visa === '482';
  const totalQuestions = is482 ? 5 : 4;
  const progress = Math.min(100, (step / totalQuestions) * 100);

  const calculation: CostCalculationBreakdown = calculateSponsorshipCosts({
    visa,
    turnover,
    workers,
    years: is482 ? years : undefined,
    adults,
    children,
  });

  const handleNext = () => {
    // If not 482 and moving from step 3 (Workers), skip step 4 (Years) to step 5 (Family)
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
    setTurnover('small');
    setWorkers(1);
    setYears(4);
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
        visa_subclass: calculation.visaLabel,
        business_turnover: turnover === 'small' ? 'Under $10 million' : '$10 million or more',
        number_of_workers: workers,
        years_of_stay: is482 ? `${years} years` : 'N/A (One-off)',
        accompanying_family: `${adults} adult(s) (18+), ${children} child(ren) (<18)`,
        nomination_fees_total: fmt(calculation.nominationTotal),
        saf_levy_total: fmt(calculation.safTotal),
        primary_vac_total: fmt(calculation.vacPrimaryTotal),
        family_vac_total: fmt(calculation.vacFamilyTotal),
        grand_total_government_charges: fmt(calculation.grandTotal),
        itemised_breakdown: {
          nomination_fee: fmt(calculation.nominationTotal),
          saf_levy: fmt(calculation.safTotal),
          vac_sponsored_workers: fmt(calculation.vacPrimaryTotal),
          vac_accompanying_family: fmt(calculation.vacFamilyTotal),
          total_government_charges: fmt(calculation.grandTotal),
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
        badge="Government Charges"
        title="Sponsorship Cost Estimator"
        description="Government charges only — our professional fee is quoted separately."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Progress Bar (For question steps 1 to 5) */}
        {step <= 5 && (
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                Question {is482 ? step : (step === 5 ? 4 : step)} of {totalQuestions}
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
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden min-h-[380px] flex flex-col">
          <div className="p-5 sm:p-8 flex-1">

            {/* STEP 1: Visa Subclass */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Building className="w-4 h-4" /> Visa Subclass
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Visa subclass
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Select the visa subclass you plan to sponsor workers under.
                </p>

                <div className="grid gap-3">
                  {[
                    { id: '482', label: '482 — Skills in Demand', desc: 'Temporary employer-sponsored visa for up to 4 years.' },
                    { id: '186', label: '186 — Employer Nomination Scheme', desc: 'Direct Permanent Residency pathway.' },
                    { id: '494', label: '494 — Regional', desc: 'Provisional regional visa with pathway to PR. Nil nomination fee.' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVisa(item.id as '482' | '186' | '494')}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                        visa === item.id
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

            {/* STEP 2: Business Turnover */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Building className="w-4 h-4" /> Business Turnover
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Business turnover
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Select your business annual turnover tier to calculate the Skilling Australians Fund (SAF) levy.
                </p>

                <div className="grid gap-3">
                  {[
                    {
                      id: 'small',
                      label: 'Under $10 million',
                      desc: is482 ? '$1,200 per year of stay' : '$3,000 one-off flat SAF levy'
                    },
                    {
                      id: 'large',
                      label: '$10 million or more',
                      desc: is482 ? '$1,800 per year of stay' : '$5,000 one-off flat SAF levy'
                    }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTurnover(item.id as 'small' | 'large')}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                        turnover === item.id
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <div>
                        <div className="text-sm sm:text-base font-bold">{item.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
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
                  <Building className="w-4 h-4" /> Primary Candidates
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Number of workers to sponsor
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Specify how many primary skilled workers you intend to nominate.
                </p>

                <div className="flex items-center justify-center gap-6 py-6 bg-slate-50 rounded-2xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setWorkers(Math.max(1, workers - 1))}
                    disabled={workers <= 1}
                    className="w-12 h-12 rounded-xl bg-white border border-gray-300 text-gray-700 flex items-center justify-center font-bold text-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="text-center min-w-[120px]">
                    <div className="text-4xl font-extrabold text-brand-primary">{workers}</div>
                    <div className="text-xs text-gray-500 font-semibold mt-1">Worker{workers > 1 ? 's' : ''}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWorkers(workers + 1)}
                    className="w-12 h-12 rounded-xl bg-white border border-gray-300 text-gray-700 flex items-center justify-center font-bold text-xl hover:bg-gray-100 shadow-xs"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Years of Stay (482 only) */}
            {step === 4 && is482 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Calendar className="w-4 h-4" /> Duration of Stay
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Years of stay requested (482 only)
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Under Subclass 482, the SAF levy is calculated per year of visa duration requested (1 to 4 years).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setYears(yr)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        years === yr
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <div className="text-xl font-bold">{yr} Year{yr > 1 ? 's' : ''}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {turnover === 'small' ? `$${(1200 * yr).toLocaleString()} SAF` : `$${(1800 * yr).toLocaleString()} SAF`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Accompanying Family */}
            {step === 5 && (
              <div className="animate-fadeIn space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                    Accompanying family members
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Total accompanying family members across all sponsored workers (leave 0 if none).
                  </p>
                </div>

                {/* Adults 18+ */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Accompanying family — adults (18+)</div>
                    <div className="text-xs text-gray-500">Total across all workers (${FEES[visa].vacAdult.toLocaleString()} VAC each)</div>
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
                      onClick={() => setAdults(adults + 1)}
                      className="w-9 h-9 rounded-lg bg-white border border-gray-300 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Children under 18 */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Accompanying family — children (under 18)</div>
                    <div className="text-xs text-gray-500">Total across all workers (${FEES[visa].vacChild.toLocaleString()} VAC each)</div>
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
                      onClick={() => setChildren(children + 1)}
                      className="w-9 h-9 rounded-lg bg-white border border-gray-300 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Lead Capture Gating */}
            {step === 6 && (
              <div className="animate-fadeIn space-y-4">
                <div className="border-b pb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-brand-primary">See the full breakdown and next steps</h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Enter your details to reveal your complete itemised government charge estimate.</p>
                </div>

                <form onSubmit={handleLeadFormSubmit} className="space-y-3.5 pt-1">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Business name *</label>
                      <input
                        name="business_name"
                        placeholder="e.g. Miller Logistics Pty Ltd"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Your name *</label>
                      <input
                        name="name"
                        placeholder="e.g. David Miller"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Email *</label>
                      <input
                        name="email"
                        type="email"
                        placeholder="david@millerlogistics.com.au"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Phone *</label>
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
                    className="w-full bg-[#012269] hover:bg-[#012269]/90 text-white py-4 text-sm sm:text-base font-bold shadow-md rounded-xl active:scale-[0.99] transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Show my full results"}
                  </Button>
                </form>
              </div>
            )}

            {/* STEP 7: Final Itemised Results Screen */}
            {step === 7 && submitted && (
              <div className="space-y-6 animate-fadeIn">
                {/* Result Card Header */}
                <div className="card-header border-b pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-brand-primary">
                    Estimated government charges — {calculation.visaLabel}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {workers} worker{workers > 1 ? 's' : ''}, {adults} adult dependant{adults !== 1 ? 's' : ''}, {children} child dependant{children !== 1 ? 's' : ''}{calculation.yearsNote}
                  </p>
                </div>

                {/* Table Breakdown */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="px-4 sm:px-6 py-3.5">Item</th>
                        <th className="px-4 sm:px-6 py-3.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 sm:px-6 py-3.5 text-gray-800">
                          Nomination fee{calculation.nominationFeeRate === 0 ? ' (none for this subclass)' : ''}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right font-semibold text-gray-900">
                          {fmt(calculation.nominationTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 sm:px-6 py-3.5 text-gray-800">
                          Skilling Australians Fund (SAF) levy
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right font-semibold text-gray-900">
                          {fmt(calculation.safTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 sm:px-6 py-3.5 text-gray-800">
                          Visa application charge — sponsored worker(s)
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right font-semibold text-gray-900">
                          {fmt(calculation.vacPrimaryTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 sm:px-6 py-3.5 text-gray-800">
                          Visa application charge — accompanying family
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right font-semibold text-gray-900">
                          {fmt(calculation.vacFamilyTotal)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/80 font-bold text-sm sm:text-base border-t-2 border-brand-primary">
                        <td className="px-4 sm:px-6 py-4 text-brand-primary">Total government charges</td>
                        <td className="px-4 sm:px-6 py-4 text-right text-brand-primary font-black">
                          {fmt(calculation.grandTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* CTA Row */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-md">
                    This covers government charges only. Our professional fee is scoped and quoted upfront once we understand your business and the role.
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
                  customText="Figures are current as verified in July 2026 per the Department of Home Affairs fee schedule and are typically indexed around 1 July each year. We'll confirm the exact charges that apply to your nomination before you commit to anything."
                  extraClause={calculation.waiverNote || undefined}
                />
              </div>
            )}

          </div>

          {/* Footer Navigation (For question steps 1 to 5) */}
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
