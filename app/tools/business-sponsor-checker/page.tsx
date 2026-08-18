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
  LOCATIONS,
  CORE_SKILLS_INCOME_THRESHOLD,
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
  Info,
  Check
} from 'lucide-react';

export default function BusinessSponsorCheckerPage() {
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState<{
    sponsorStatus: 'first_time' | 'approved';
    lawfullyTrading: 'yes' | 'no' | 'setting_up';
    financialCapacity: 'yes' | 'not_sure' | 'no';
    industry: string;
    salary: number | string;
    lmtStatus: 'already_done' | 'not_yet_willing' | 'not_sure';
    location: string;
    complianceIssues: 'no' | 'not_sure' | 'yes';
  }>({
    sponsorStatus: 'first_time',
    lawfullyTrading: 'yes',
    financialCapacity: 'yes',
    industry: 'trades_construction',
    salary: 85000,
    lmtStatus: 'already_done',
    location: 'NSW_METRO',
    complianceIssues: 'no',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If first-time sponsor: 8 question steps. If approved sponsor: 7 question steps.
  const isFirstTime = responses.sponsorStatus === 'first_time';
  const totalQuestions = isFirstTime ? 8 : 7;
  const progress = Math.min(100, (step / totalQuestions) * 100);

  const handleSelectOption = (key: string, value: unknown) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    // Validation per step
    if (step === 1 && !responses.sponsorStatus) return;
    if (step === 2 && !responses.lawfullyTrading) return;
    if (step === 3 && !responses.financialCapacity) return;
    if (step === 4 && !responses.industry) return;
    if (step === 5 && (!responses.salary || Number(responses.salary) <= 0)) return;
    if (step === 6 && !responses.lmtStatus) return;
    if (step === 7 && !responses.location) return;

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
      sponsorStatus: 'first_time',
      lawfullyTrading: 'yes',
      financialCapacity: 'yes',
      industry: 'trades_construction',
      salary: 85000,
      lmtStatus: 'already_done',
      location: 'NSW_METRO',
      complianceIssues: 'no',
    });
    setSubmitted(false);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const processAssessment = (): EligibilityResult => {
    const input: EligibilityEvaluationInput = {
      sponsorStatus: responses.sponsorStatus,
      lawfullyTrading: responses.lawfullyTrading,
      financialCapacity: responses.financialCapacity,
      industry: responses.industry,
      salary: Number(responses.salary) || 0,
      lmtStatus: responses.lmtStatus,
      location: responses.location,
      complianceIssues: responses.sponsorStatus === 'first_time' ? responses.complianceIssues : 'no',
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
        sponsor_status: responses.sponsorStatus === 'first_time' ? 'First-Time Sponsor' : 'Approved Sponsor',
        lawfully_trading: responses.lawfullyTrading === 'yes' ? 'Yes, Actively Trading' : responses.lawfullyTrading === 'setting_up' ? 'Setting Up AU Operation' : 'No',
        financial_capacity: responses.financialCapacity === 'yes' ? 'Yes' : responses.financialCapacity === 'not_sure' ? 'Not Sure' : 'No',
        industry: INDUSTRIES.find(i => i.value === responses.industry)?.label || responses.industry,
        offered_salary: `$${Number(responses.salary).toLocaleString()} AUD`,
        salary_meets_csit: Number(responses.salary) >= CORE_SKILLS_INCOME_THRESHOLD ? 'Yes' : 'No (Below $79,499)',
        labour_market_testing: responses.lmtStatus === 'already_done' ? 'Yes, Already Done' : responses.lmtStatus === 'not_yet_willing' ? 'Not Yet, Willing' : 'Not Sure',
        location: LOCATIONS.find(l => l.value === responses.location)?.label || responses.location,
        compliance_issues: responses.sponsorStatus === 'first_time' ? (responses.complianceIssues === 'no' ? 'None' : responses.complianceIssues === 'yes' ? 'Yes, Past Issues Reported' : 'Not Sure') : 'N/A (Approved Sponsor)',
        calculated_tier: result.badgeTitle,
        headline: result.headline,
        summary: result.summary,
        flags_count: result.flags.length,
        identified_action_items: result.flags.map(f => ({
          type: f.type,
          title: f.title,
          detail: f.detail,
          action: f.actionItem || 'Review with migration agent'
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
        badge="Employer Sponsoring"
        title="Can My Business Sponsor? Eligibility Quick-Check"
        description="A fast, self-serve diagnostic for Australian employers looking to sponsor overseas skilled workers under Subclass 482, 186, or 494 visas."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Progress Bar (For question steps 1 to 8) */}
        {step <= totalQuestions && (
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                Step {step} of {totalQuestions}
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

            {/* STEP 1: Sponsorship Status */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" /> Sponsorship Profile
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  What is your business sponsorship status?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Select whether your business is applying for Standard Business Sponsorship (SBS) for the first time or is already an approved sponsor.
                </p>

                <div className="grid gap-3">
                  {[
                    { value: 'first_time', label: 'First-time sponsor', desc: 'Applying for Standard Business Sponsorship (SBS) accreditation for the first time' },
                    { value: 'approved', label: 'Already an approved sponsor', desc: 'Currently holds active Standard Business Sponsorship accreditation' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('sponsorStatus', opt.value)}
                      className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                        responses.sponsorStatus === opt.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm sm:text-base">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                      </div>
                      {responses.sponsorStatus === opt.value && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Lawfully Operating & Trading */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" /> Australian Trading Status
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Is the business lawfully operating and actively trading in Australia?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  An active Australian business entity (ABN/ACN) trading lawfully is a statutory prerequisite for Standard Business Sponsorship.
                </p>

                <div className="grid gap-3">
                  {[
                    { value: 'yes', label: 'Yes, actively trading in Australia', desc: 'Registered Australian business entity (ABN/ACN) with active commercial operations' },
                    { value: 'setting_up', label: 'We’re setting up an Australian operation', desc: 'Overseas business establishing an Australian branch, subsidiary, or new entity' },
                    { value: 'no', label: 'No, not operating in Australia', desc: 'Not currently registered or actively trading in Australia' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('lawfullyTrading', opt.value)}
                      className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                        responses.lawfullyTrading === opt.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm sm:text-base">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                      </div>
                      {responses.lawfullyTrading === opt.value && (
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
                  <DollarSign className="w-4 h-4" /> Financial Viability
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Can the business demonstrate financial capacity to meet sponsorship costs?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Evidence can include recent BAS, balance sheets, profit &amp; loss statements, or accountant declarations.
                </p>

                <div className="grid gap-3">
                  {[
                    { value: 'yes', label: 'Yes, fully solvent & profitable', desc: 'Strong balance sheet, healthy cash flow, or sufficient revenue reserves' },
                    { value: 'not_sure', label: 'Not sure / Need document review', desc: 'We have financials but need guidance on satisfying Department benchmarks' },
                    { value: 'no', label: 'No, currently in financial hardship', desc: 'Operating with significant loss or insolvency challenges' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('financialCapacity', opt.value)}
                      className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                        responses.financialCapacity === opt.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm sm:text-base">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                      </div>
                      {responses.financialCapacity === opt.value && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Business Industry */}
            {step === 4 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" /> Industry Sector
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Which industry does your business operate in?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Certain sectors (e.g. Health, Aged Care, Construction, Tech) benefit from priority visa processing and labour agreement streams.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.value}
                      type="button"
                      onClick={() => handleSelectOption('industry', ind.value)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                        responses.industry === ind.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <span className="text-sm">{ind.label}</span>
                      {responses.industry === ind.value && (
                        <Check className="w-4 h-4 text-brand-accent shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Annual Salary Offered */}
            {step === 5 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" /> Salary &amp; TSMIT
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  What annual base salary (AUD) is offered for the nominated role?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  The Core Skills Income Threshold (CSIT / TSMIT) is currently <strong>${CORE_SKILLS_INCOME_THRESHOLD.toLocaleString()} AUD</strong>.
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-base">$</span>
                    <input
                      type="number"
                      min="30000"
                      max="500000"
                      step="1000"
                      value={responses.salary}
                      onChange={(e) => handleSelectOption('salary', e.target.value)}
                      placeholder="79499"
                      className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-brand-primary focus:ring-0 outline-none text-gray-900 font-bold text-lg"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {[79499, 85000, 95000, 110000, 130000].map((sal) => (
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
                        ${sal.toLocaleString()} AUD {sal === 79499 ? '(Min Threshold)' : ''}
                      </button>
                    ))}
                  </div>

                  {Number(responses.salary) >= CORE_SKILLS_INCOME_THRESHOLD ? (
                    <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-green-900 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span>Offered salary meets the statutory Core Skills Income Threshold ($79,499+).</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Offered salary is below $79,499. Role may require salary adjustment or DAMA / labour agreement concessions.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: Labour Market Testing */}
            {step === 6 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" /> Labour Market Testing (LMT)
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Has the nominated role been advertised locally in Australia?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Most employer nominations require advertising the role locally across 2+ approved platforms (e.g. SEEK, Workforce Australia) for at least 4 weeks.
                </p>

                <div className="grid gap-3">
                  {[
                    { value: 'already_done', label: 'Yes, already done', desc: 'Compliant job advertisements run within the past 4 months' },
                    { value: 'not_yet_willing', label: 'Not yet, but willing to advertise', desc: 'Ready to place compliant job adverts before nominating' },
                    { value: 'not_sure', label: 'Not sure what this means', desc: 'Need guidance on required platforms, wording, and timing' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('lmtStatus', opt.value)}
                      className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                        responses.lmtStatus === opt.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm sm:text-base">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                      </div>
                      {responses.lmtStatus === opt.value && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: Business Location */}
            {step === 7 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4" /> Operating Region
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Where is the business or primary work location situated?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Identifies regional visa opportunities (Subclass 494) and DAMA (Designated Area Migration Agreement) concessions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() => handleSelectOption('location', loc.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                        responses.location === loc.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary font-bold shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold">{loc.label}</div>
                        {loc.isDama && (
                          <span className="text-[10px] text-blue-700 font-bold uppercase">★ DAMA Eligible</span>
                        )}
                      </div>
                      {responses.location === loc.value && (
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
                  <ShieldAlert className="w-4 h-4" /> Compliance Check
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2">
                  Any prior workplace relations or immigration compliance issues?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  (Shown for first-time sponsors) Have Fair Work Ombudsman sanctions, visa cancellations, or unresolved employment disputes occurred in the past?
                </p>

                <div className="grid gap-3">
                  {[
                    { value: 'no', label: 'No issues', desc: 'Clean regulatory record across Fair Work and Immigration' },
                    { value: 'not_sure', label: 'Not sure / Minor past dispute', desc: 'Need review to confirm adverse information status' },
                    { value: 'yes', label: 'Yes, past compliance issues', desc: 'Requires proactive strategy and mitigation with an agent' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('complianceIssues', opt.value)}
                      className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                        responses.complianceIssues === opt.value
                          ? 'border-brand-primary bg-brand-soft/80 text-brand-primary shadow-xs'
                          : 'border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm sm:text-base">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                      </div>
                      {responses.complianceIssues === opt.value && (
                        <Check className="w-5 h-5 text-brand-accent shrink-0 ml-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 9: Contact Details & Lead Capture Gating */}
            {step === 9 && (
              <div className="animate-fadeIn space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 font-semibold leading-relaxed">
                    Please enter your business contact details below to instantly calculate and view your eligibility diagnostic report.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-brand-primary">Get Your Detailed Business Sponsorship Report</h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">We will generate your customized action plan and concession recommendations.</p>
                </div>

                <form onSubmit={handleLeadFormSubmit} className="space-y-3.5 pt-2">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Your Full Name *</label>
                      <input
                        name="name"
                        placeholder="e.g. Sarah Jenkins"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Business / Company Name *</label>
                      <input
                        name="business_name"
                        placeholder="e.g. Apex Construction Pty Ltd"
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
                        placeholder="sarah@apexconstruction.com.au"
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
                    className="w-full bg-[#e40229] hover:bg-[#e40229]/95 text-white py-4 text-sm sm:text-base font-bold shadow-md rounded-xl active:scale-[0.99] transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Details & View Assessment"}
                  </Button>
                </form>
              </div>
            )}

            {/* STEP 10: Results Screen */}
            {step === 10 && submitted && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <h4 className="font-bold text-green-900 text-sm sm:text-base">Thank you! Your assessment has been saved.</h4>
                  <p className="text-green-700 text-xs mt-0.5">Below is your customized business sponsorship eligibility diagnostic:</p>
                </div>

                {/* Verdict Badge Card */}
                <div className={`p-6 rounded-2xl border-2 text-center space-y-2 ${
                  result.tier === 'strong_candidate'
                    ? 'bg-green-50 border-green-200 text-green-950'
                    : result.tier === 'possible'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-red-50 border-red-200 text-red-950'
                }`}>
                  <div className="flex justify-center mb-1">
                    {result.tier === 'strong_candidate' && <CheckCircle2 className="w-12 h-12 text-green-600" />}
                    {result.tier === 'possible' && <AlertTriangle className="w-12 h-12 text-amber-600" />}
                    {result.tier === 'hard_stop' && <XCircle className="w-12 h-12 text-red-600" />}
                  </div>

                  <span className="text-[11px] uppercase font-extrabold tracking-widest opacity-80">Preliminary Verdict</span>
                  <h3 className="text-xl sm:text-2xl font-black">{result.badgeTitle}</h3>
                  <p className="text-xs sm:text-sm max-w-xl mx-auto opacity-90 leading-relaxed">{result.headline}</p>
                </div>

                {/* Findings & Action Items */}
                <div className="space-y-3">
                  <h4 className="font-bold text-brand-primary text-sm border-b pb-2">Diagnostic Findings &amp; Action Plan:</h4>

                  {result.flags.length === 0 ? (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-green-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>No regulatory blockers identified. Your business is ready to proceed with Standard Business Sponsorship.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {result.flags.map((flag, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border text-xs space-y-1 ${
                            flag.type === 'hard_stop'
                              ? 'bg-red-50/70 border-red-200 text-red-950'
                              : flag.type === 'fixable'
                                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                : 'bg-blue-50/70 border-blue-200 text-blue-950'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            {flag.type === 'hard_stop' && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                            {flag.type === 'fixable' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                            {flag.type === 'bonus' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />}
                            <span>{flag.title}</span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{flag.detail}</p>
                          {flag.actionItem && (
                            <p className="font-bold text-brand-accent pt-1">
                              Action: {flag.actionItem}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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

                <ToolDisclaimer />
              </div>
            )}

          </div>

          {/* Footer Navigation (For steps 1 to 8) */}
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
