"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ToolHeader } from '@/components/tools/shared/tool-header';
import { ToolDisclaimer } from '@/components/tools/shared/tool-disclaimer';
import { Button } from '@/components/ui/button';
import { submitToolLead } from '@/app/actions/tools';
import {
  evaluateBusinessSponsorEligibility,
  INDUSTRIES,
  REGIONS,
  CSIT,
  EligibilityEvaluationInput,
  EligibilityResult
} from '@/lib/tools/sponsorship-calculator-data';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Building2,
  DollarSign,
  Briefcase,
  MapPin,
  ShieldAlert,
  Loader2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';

export default function BusinessSponsorCheckerPage() {
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState<{
    sponsorStatus: 'first' | 'existing';
    trading: 'yes' | 'establishing' | 'no';
    financial: 'yes' | 'notsure' | 'no';
    industry: string;
    salary: number | string;
    lmt: 'done' | 'willing' | 'unsure';
    region: string;
    compliance: 'no' | 'notsure' | 'yes';
  }>({
    sponsorStatus: 'first',
    trading: 'yes',
    financial: 'yes',
    industry: 'Trades & Construction',
    salary: 85000,
    lmt: 'done',
    region: 'metro',
    compliance: 'no',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If first-time sponsor: 8 question steps. If already approved sponsor: 7 question steps (compliance skipped).
  const isFirstTime = responses.sponsorStatus === 'first';
  const totalQuestions = isFirstTime ? 8 : 7;
  const progress = Math.min(100, (step / totalQuestions) * 100);

  const handleSelectOption = (key: string, value: unknown) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    // Validation per step
    if (step === 1 && !responses.sponsorStatus) return;
    if (step === 2 && !responses.trading) return;
    if (step === 3 && !responses.financial) return;
    if (step === 4 && !responses.industry) return;
    if (step === 5 && (!responses.salary || Number(responses.salary) <= 0)) return;
    if (step === 6 && !responses.lmt) return;
    if (step === 7 && !responses.region) return;

    if (step < totalQuestions) {
      setStep(step + 1);
    } else {
      setStep(9); // Lead capture step
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetTool = () => {
    setStep(1);
    setResponses({
      sponsorStatus: 'first',
      trading: 'yes',
      financial: 'yes',
      industry: 'Trades & Construction',
      salary: 85000,
      lmt: 'done',
      region: 'metro',
      compliance: 'no',
    });
    setSubmitted(false);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const processAssessment = (): EligibilityResult => {
    const input: EligibilityEvaluationInput = {
      sponsorStatus: responses.sponsorStatus,
      trading: responses.trading,
      financial: responses.financial,
      industry: responses.industry,
      salary: Number(responses.salary) || 0,
      lmt: responses.lmt,
      region: responses.region,
      compliance: responses.sponsorStatus === 'first' ? responses.compliance : 'no',
    };
    return evaluateBusinessSponsorEligibility(input);
  };

  const handleLeadFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = processAssessment();

    const data = {
      tool_name: "Can My Business Sponsor? Eligibility Quick-Check",
      user_name: formData.get('name') as string,
      user_email: formData.get('email') as string,
      user_phone: formData.get('phone') as string,
      results: {
        business_name: (formData.get('business_name') as string) || 'N/A',
        sponsor_status: responses.sponsorStatus === 'first' ? 'First-time sponsor' : 'Already an approved sponsor',
        lawfully_trading: responses.trading === 'yes' ? 'Yes' : responses.trading === 'establishing' ? "We're setting up an Australian operation" : 'No',
        financial_capacity: responses.financial === 'yes' ? 'Yes' : responses.financial === 'notsure' ? 'Not sure' : 'No',
        industry: responses.industry,
        offered_salary: `$${Number(responses.salary).toLocaleString()} AUD`,
        salary_meets_csit: Number(responses.salary) >= CSIT ? 'Yes' : 'No (Below $79,499)',
        labour_market_testing: responses.lmt === 'done' ? 'Yes, already done' : responses.lmt === 'willing' ? 'Not yet, but willing' : 'Not sure what this means',
        region: REGIONS.find(r => r.value === responses.region)?.label || responses.region,
        compliance_issues: responses.sponsorStatus === 'first' ? (responses.compliance === 'no' ? 'No' : responses.compliance === 'yes' ? 'Yes' : 'Not sure') : 'N/A (Approved Sponsor)',
        calculated_tier: result.title,
        headline: result.title,
        summary: result.sub,
        flags_count: result.items.length,
        identified_action_items: result.items.map(item => ({
          type: item.type,
          title: item.title,
          detail: item.body,
          action: item.title
        }))
      }
    };

    const res = await submitToolLead(data);

    if (res.success) {
      setSubmitted(true);
      setStep(10); // Show results screen
    } else {
      setErrorMsg(res.error || "Failed to save details. Please try again.");
    }
    setLoading(false);
  };

  const result = processAssessment();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20" suppressHydrationWarning>
      <ToolHeader
        badge="Employer Sponsorship"
        title="Can My Business Sponsor? Eligibility Quick-Check"
        description="A few questions, indicative result in under a minute. Not a formal assessment."
      />

      <div className="max-w-3xl mx-auto px-3 sm:px-6">
        {/* Progress Bar (For question steps 1 to 8) */}
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

            {/* STEP 1: Sponsor Status */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" /> Sponsor Status
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  What is your business sponsorship status?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Select whether you are applying for the first time or already hold approved sponsor status.
                </p>

                <div className="grid gap-3">
                  {[
                    { value: 'first', label: 'First-time sponsor' },
                    { value: 'existing', label: 'Already an approved sponsor' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('sponsorStatus', opt.value)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                        responses.sponsorStatus === opt.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{opt.label}</span>
                      {responses.sponsorStatus === opt.value && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Trading Status */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" /> Operating Status
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Is the business lawfully operating and actively trading in Australia?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Standard Business Sponsorship generally requires a lawfully operating, actively trading Australian business.
                </p>

                <div className="grid gap-3">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'establishing', label: "We're setting up an Australian operation" },
                    { value: 'no', label: 'No' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('trading', opt.value)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                        responses.trading === opt.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{opt.label}</span>
                      {responses.trading === opt.value && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Financial Capacity */}
            {step === 3 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" /> Financial Capacity
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Can the business demonstrate financial capacity to meet sponsorship costs?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Evidence can include financial statements, BAS, and payroll records.
                </p>

                <div className="grid gap-3">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'notsure', label: 'Not sure' },
                    { value: 'no', label: 'No' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('financial', opt.value)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                        responses.financial === opt.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{opt.label}</span>
                      {responses.financial === opt.value && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Industry */}
            {step === 4 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" /> Industry
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Which industry does your business operate in?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Select your primary industry sector.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => handleSelectOption('industry', ind)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                        responses.industry === ind
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <span className="text-sm">{ind}</span>
                      {responses.industry === ind && (
                        <Check className="w-4 h-4 text-brand-accent shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Annual Salary */}
            {step === 5 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" /> Offered Salary
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Annual salary offered for the role (AUD)
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  The Core Skills Income Threshold is <strong>${CSIT.toLocaleString()} AUD</strong>.
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-base">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={responses.salary}
                      onChange={(e) => handleSelectOption('salary', e.target.value)}
                      placeholder="e.g. 75000"
                      className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-brand-primary focus:ring-0 outline-none text-gray-900 font-bold text-lg"
                    />
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="flex flex-wrap gap-2">
                    {[75000, 79499, 85000, 95000, 120000].map((sal) => (
                      <button
                        key={sal}
                        type="button"
                        onClick={() => handleSelectOption('salary', sal)}
                        className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          Number(responses.salary) === sal
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        ${sal.toLocaleString()} AUD {sal === 79499 ? '(CSIT Threshold)' : ''}
                      </button>
                    ))}
                  </div>

                  {Number(responses.salary) >= CSIT ? (
                    <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-green-900 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span>Salary meets or exceeds the Core Skills Income Threshold ($79,499+).</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Offered salary is below $79,499. May require adjustment or labour agreement/DAMA concessions.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: Labour Market Testing */}
            {step === 6 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" /> Labour Market Testing
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Has the role been advertised locally (labour market testing)?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  You’ll generally need to advertise the role locally before nominating.
                </p>

                <div className="grid gap-3">
                  {[
                    { value: 'done', label: 'Yes, already done' },
                    { value: 'willing', label: 'Not yet, but willing' },
                    { value: 'unsure', label: 'Not sure what this means' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('lmt', opt.value)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                        responses.lmt === opt.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{opt.label}</span>
                      {responses.lmt === opt.value && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: Business Region */}
            {step === 7 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4" /> Business Region
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Business region
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Select your operating location in Australia.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {REGIONS.map((reg) => (
                    <button
                      key={reg.value}
                      type="button"
                      onClick={() => handleSelectOption('region', reg.value)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                        responses.region === reg.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <div>
                        <span className="text-sm">{reg.label}</span>
                        {reg.isRegional && (
                          <span className="text-[10px] text-blue-700 font-bold uppercase block mt-0.5">★ Regional Concessions</span>
                        )}
                      </div>
                      {responses.region === reg.value && (
                        <Check className="w-4 h-4 text-brand-accent shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 8: Compliance History (First-time Sponsors Only) */}
            {step === 8 && isFirstTime && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" /> Compliance History
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Any prior workplace or immigration law compliance issues?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  (Shown for first-time sponsors) Prior issues need a proper conversation before application work starts.
                </p>

                <div className="grid gap-3">
                  {[
                    { value: 'no', label: 'No' },
                    { value: 'notsure', label: 'Not sure' },
                    { value: 'yes', label: 'Yes' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('compliance', opt.value)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                        responses.compliance === opt.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{opt.label}</span>
                      {responses.compliance === opt.value && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 9: Lead Capture (See the full breakdown and next steps) */}
            {step === 9 && (
              <div className="animate-fadeIn space-y-4">
                <div className="border-b pb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-brand-primary">See the full breakdown and next steps</h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Enter your details below to reveal your preliminary results and tailored action plan.</p>
                </div>

                <form onSubmit={handleLeadFormSubmit} className="space-y-3.5 pt-1">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Business name *</label>
                      <input
                        name="business_name"
                        placeholder="e.g. Apex Construction Pty Ltd"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-base sm:text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Your name *</label>
                      <input
                        name="name"
                        placeholder="e.g. Sarah Jenkins"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-base sm:text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Email *</label>
                      <input
                        name="email"
                        type="email"
                        placeholder="sarah@apexconstruction.com.au"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-base sm:text-sm bg-white"
                      />
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
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      name="consent"
                      required
                      defaultChecked
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 leading-relaxed">
                      I consent to Migration Republic contacting me regarding my business sponsorship assessment.
                    </span>
                  </label>

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

            {/* STEP 10: Results Screen */}
            {step === 10 && submitted && (
              <div className="space-y-6 animate-fadeIn">
                {/* Verdict Card */}
                <div className={`p-6 rounded-2xl border-2 text-center space-y-2 ${
                  result.cls === 'ok'
                    ? 'bg-[#EDF6EF] border-[#BFE1C9] text-[#2E7D4F]'
                    : result.cls === 'warn'
                      ? 'bg-[#FBF1E5] border-[#EAD1AC] text-[#A9631E]'
                      : 'bg-[#FBEBE9] border-[#EFC1BC] text-[#B0362C]'
                }`}>
                  <div className="flex justify-center mb-1">
                    {result.cls === 'ok' && <CheckCircle2 className="w-12 h-12 text-[#2E7D4F]" />}
                    {result.cls === 'warn' && <AlertTriangle className="w-12 h-12 text-[#A9631E]" />}
                    {result.cls === 'stop' && <XCircle className="w-12 h-12 text-[#B0362C]" />}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black">{result.title}</h3>
                  <p className="text-xs sm:text-sm max-w-xl mx-auto opacity-90 leading-relaxed text-gray-800">{result.sub}</p>
                </div>

                {/* Findings List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-brand-primary text-sm border-b pb-2">Full Assessment Breakdown:</h4>

                  {result.items.length === 0 ? (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-green-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>No specific issues flagged. Your business looks like a strong candidate for sponsorship.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {result.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs text-xs space-y-1"
                        >
                          <div className="font-bold text-sm text-[#012269] flex items-center gap-1.5">
                            {item.type === 'hard_stop' && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                            {item.type === 'flag' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                            {item.type === 'bonus' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />}
                            <span>{item.title}</span>
                          </div>
                          <p className="text-gray-700 leading-relaxed pt-0.5">{item.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA Row & Consultation */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Ready to talk it through?</p>
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
                      Book a consultation
                    </Link>
                  </div>
                </div>

                <ToolDisclaimer
                  customText="This is an indicative guide only, not a formal migration assessment, and it doesn't guarantee any outcome — only the Department of Home Affairs approves a visa application. Book a consultation for a full assessment tailored to your business."
                />
              </div>
            )}

          </div>

          {/* Footer Navigation (For question steps 1 to 8) */}
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
