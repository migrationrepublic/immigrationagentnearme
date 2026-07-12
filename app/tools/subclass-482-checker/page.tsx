"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { submitToolLead } from '@/app/actions/tools';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/shared/tool-header';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Loader2,
  Search,
  Check
} from 'lucide-react';

const CSOL_OCCUPATIONS = [
  { name: "Software Engineer", code: "261313" },
  { name: "Registered Nurse (General)", code: "254499" },
  { name: "Chef", code: "351311" },
  { name: "Accountant (General)", code: "221111" },
  { name: "Civil Engineer", code: "233211" },
  { name: "ICT Business Analyst", code: "261111" },
  { name: "Mechanical Engineer", code: "233512" },
  { name: "Marketing Specialist", code: "225113" },
  { name: "General Practitioner", code: "253111" },
  { name: "Construction Project Manager", code: "133111" },
  { name: "Developer Programmer", code: "261312" },
  { name: "Quantity Surveyor", code: "233213" },
  { name: "Early Childhood (Pre-primary School) Teacher", code: "241111" },
  { name: "Secondary School Teacher", code: "241411" },
  { name: "Solicitor", code: "271311" },
  { name: "Motor Mechanic (General)", code: "321211" },
  { name: "Carpenter", code: "331112" },
  { name: "Electrician (General)", code: "341111" },
  { name: "Social Worker", code: "272511" },
  { name: "Database Administrator", code: "262111" },
  { name: "Systems Analyst", code: "261112" },
  { name: "Web Developer", code: "261314" },
  { name: "Management Consultant", code: "224711" },
  { name: "Project Builder", code: "133112" },
  { name: "Graphic Designer", code: "232411" }
];

export default function Subclass482CheckerPage() {
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState<Record<string, any>>({
    history: []
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search state for occupations
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const totalSteps = 8;
  const progress = (step / totalSteps) * 100;

  const handleSelectOption = (key: string, value: any) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleHistory = (value: string) => {
    const current = responses.history || [];
    if (value === 'none') {
      setResponses(prev => ({ ...prev, history: ['none'] }));
      return;
    }

    let updated = current.filter((v: string) => v !== 'none');
    if (updated.includes(value)) {
      updated = updated.filter((v: string) => v !== value);
    } else {
      updated.push(value);
    }

    if (updated.length === 0) {
      updated = ['none'];
    }
    setResponses(prev => ({ ...prev, history: updated }));
  };

  const handleNext = () => {
    // Validation checks per step
    if (step === 1 && !responses.sponsorship) return;
    if (step === 2 && !responses.occupation) return;
    if (step === 3 && (!responses.experience || !responses.recency || !responses.exp_type)) return;
    if (step === 4 && !responses.english) return;
    if (step === 5 && !responses.has_qualification) return;
    if (step === 5 && responses.has_qualification === 'yes' && !responses.qualification_name) return;
    if (step === 6 && !responses.skills_assessment) return;
    if (step === 7 && !responses.location) return;
    if (step === 7 && responses.location === 'australia' && !responses.current_visa) return;
    if (step === 8 && (!responses.history || responses.history.length === 0)) return;

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setStep(9); // Lead capture details form step
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetTool = () => {
    setStep(1);
    setResponses({ history: [] });
    setSubmitted(false);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Logic to process responses and calculate results & flags
  const processAssessment = () => {
    const flags: string[] = [];

    // Step 1 Sponsorship Flags
    if (responses.sponsorship === 'no') {
      flags.push("No sponsoring employer");
    } else if (responses.sponsorship === 'maybe') {
      flags.push("Employer sponsorship requires confirmation");
    }

    // Step 2 Occupation Flags
    if (responses.occupation === 'other') {
      flags.push("Occupation not identified");
    } else if (responses.occupation === 'manual') {
      flags.push("Occupation requires review");
    }

    // Step 3 Work Experience Flags
    if (responses.experience === 'less-1') {
      flags.push("Less than one year experience");
    }
    if (responses.recency === 'no') {
      flags.push("Experience outside five-year requirement");
    } else if (responses.recency === 'partly') {
      flags.push("Experience requires verification");
    }
    if (['part-time', 'casual', 'self-employed'].includes(responses.exp_type)) {
      flags.push("Equivalent full-time experience requires verification");
    }

    // Step 5 Qualifications Flags
    if (responses.has_qualification === 'no') {
      flags.push("Qualification not held");
    } else {
      flags.push("Qualification requires verification");
    }

    // Step 4 English Flags
    if (responses.english === 'none') {
      flags.push("English requirement not satisfied");
    } else if (responses.english === 'exemption') {
      flags.push("English exemption requires confirmation");
    }

    // Step 6 Skills Assessment Flags
    if (responses.skills_assessment === 'no') {
      flags.push("Skills assessment may be required");
    } else if (responses.skills_assessment === 'not-required') {
      flags.push("Skills assessment requirement requires confirmation");
    }

    // Step 7 Current Location / Visa Flags
    if (responses.location === 'australia') {
      if (responses.current_visa === 'working-holiday') {
        flags.push("Current work limitation");
      } else if (responses.current_visa === 'visitor') {
        flags.push("Visitor work rights review");
      } else if (responses.current_visa === 'bridging') {
        flags.push("Bridging visa review");
      } else if (responses.current_visa === '482') {
        flags.push("Current sponsorship requires review");
      } else if (responses.current_visa === 'other') {
        flags.push("Current visa requires review");
      }
    }

    // Step 8 Immigration History Flags
    const historyList = responses.history || [];
    if (historyList.includes('refused')) {
      flags.push("Previous refusal requires assessment");
    }
    if (historyList.includes('cancelled')) {
      flags.push("Previous cancellation requires assessment");
    }
    if (historyList.includes('protection')) {
      flags.push("Protection visa history requires assessment");
      flags.push("Possible Section 48 issue");
    }
    if (historyList.includes('bridging')) {
      flags.push("Current or previous bridging visa requires review");
    }

    // Determine eligibility category
    let resultType: 'eligible' | 'further' | 'alternative' | 'ineligible' = 'further';

    const hasCriticalIssues =
      responses.sponsorship === 'no' ||
      responses.experience === 'less-1' ||
      responses.occupation === 'other';

    if (responses.sponsorship === 'yes' &&
      responses.experience !== 'less-1' &&
      responses.recency === 'yes' &&
      responses.occupation !== 'other' &&
      responses.occupation !== 'manual' &&
      responses.english === 'ielts-5' &&
      flags.filter(f => !["Qualification requires verification"].includes(f)).length === 0) {
      resultType = 'eligible';
    } else if (responses.sponsorship === 'no') {
      if (responses.experience !== 'less-1') {
        resultType = 'alternative';
      } else {
        resultType = 'ineligible';
      }
    } else if (hasCriticalIssues) {
      resultType = 'ineligible';
    } else {
      resultType = 'further';
    }

    return { resultType, flags };
  };

  const handleLeadFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const { resultType, flags } = processAssessment();

    const data = {
      tool_name: "Subclass 482 Eligibility Checker",
      user_name: formData.get('name') as string,
      user_email: formData.get('email') as string,
      user_phone: formData.get('phone') as string,
      results: {
        passport_country: formData.get('passport_country') as string,
        current_country: formData.get('current_country') as string,
        occupation: formData.get('occupation') as string,
        employer_name: formData.get('employer') as string || 'N/A',
        consent_given: formData.get('consent') === 'on' ? 'Yes' : 'No',
        quiz_responses: responses,
        calculated_category: resultType,
        identified_flags: flags
      }
    };

    const res = await submitToolLead(data);

    if (res.success) {
      setSubmitted(true);
      setStep(10); // Show results screen
    } else {
      setErrorMsg("Failed to save details. Please try again.");
    }
    setLoading(false);
  };

  const filteredOccupations = CSOL_OCCUPATIONS.filter(o =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.code.includes(searchQuery)
  );

  const { resultType, flags } = processAssessment();

  return (
    <div className="min-h-screen bg-brand-soft/30 py-12 px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
      <div className="max-w-4xl mx-auto">
        <ToolHeader
          title="Subclass 482 Visa Eligibility Checker"
          description="Assess your preliminary eligibility criteria for the Subclass 482 Skills in Demand Visa."
        />

        {step <= totalSteps && (
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                Step {step} of {totalSteps}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-accent transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[450px] flex flex-col">
          <div className="p-8 md:p-12 flex-1">

            {/* STEP 1: Employer Sponsorship */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-primary mb-6">
                  Do you have an Australian employer willing to sponsor you?
                </h2>
                <div className="grid gap-4">
                  {[
                    { label: 'Yes, I have an employer willing to sponsor me', value: 'yes' },
                    { label: 'My employer is considering sponsoring me', value: 'maybe' },
                    { label: 'No, I do not have a sponsoring employer', value: 'no' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('sponsorship', opt.value)}
                      className={`flex items-center justify-between p-5 rounded-xl border-2 text-left transition-all ${responses.sponsorship === opt.value
                          ? "border-brand-primary bg-brand-soft text-brand-primary shadow-sm"
                          : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                        }`}
                    >
                      <span className="font-medium text-base">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Occupation */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-primary mb-4">
                  What occupation will your employer nominate you for?
                </h2>
                <p className="text-gray-500 mb-6 text-sm">
                  Search the Core Skills Occupation List (CSOL) below or type your custom occupation if not listed.
                </p>

                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search occupation name or ANZSCO code..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none text-base"
                  />

                  {showDropdown && searchQuery.trim() !== '' && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 mt-2 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredOccupations.length > 0 ? (
                        filteredOccupations.map(occ => (
                          <div
                            key={occ.code}
                            onClick={() => {
                              handleSelectOption('occupation', occ.name);
                              handleSelectOption('occupation_code', occ.code);
                              setSearchQuery(`${occ.name} (${occ.code})`);
                              setShowDropdown(false);
                            }}
                            className="px-4 py-3 hover:bg-brand-soft/50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                          >
                            <span className="font-medium text-gray-900">{occ.name}</span>
                            <span className="text-xs text-gray-400">ANZSCO: {occ.code}</span>
                          </div>
                        ))
                      ) : (
                        <div
                          onClick={() => {
                            handleSelectOption('occupation', 'other');
                            handleSelectOption('occupation_code', 'other');
                            setShowDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-brand-soft/50 cursor-pointer text-gray-500 font-semibold"
                        >
                          Occupation not listed? Click to enter custom occupation (&quot;Other&quot;)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectOption('occupation', 'other');
                      handleSelectOption('occupation_code', 'other');
                      setSearchQuery('Other / Not Listed');
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${responses.occupation === 'other'
                        ? "border-brand-primary bg-brand-soft text-brand-primary shadow-sm"
                        : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                      }`}
                  >
                    <div>
                      <p className="font-semibold text-base">Other / My occupation is not in the list</p>
                      <p className="text-xs text-gray-500">Requires manual assessment review by an agent.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectOption('occupation', 'manual');
                      handleSelectOption('occupation_code', 'manual');
                      setSearchQuery('Manual Review Needed');
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${responses.occupation === 'manual'
                        ? "border-brand-primary bg-brand-soft text-brand-primary shadow-sm"
                        : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                      }`}
                  >
                    <div>
                      <p className="font-semibold text-base">Unsure / Requires eligibility confirmation</p>
                      <p className="text-xs text-gray-500">Subject to review against full migration lists.</p>
                    </div>
                  </button>
                </div>

                {responses.occupation && (
                  <div className="mt-6 bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-900 font-medium">
                      Selected: <strong>{responses.occupation === 'other' ? 'Custom Occupation' : responses.occupation}</strong> {responses.occupation_code && responses.occupation_code !== 'other' && responses.occupation_code !== 'manual' && `(Code: ${responses.occupation_code})`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Work Experience */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-primary mb-6">
                  Tell us about your relevant work experience
                </h2>

                <div className="space-y-6">
                  {/* Experience Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      How much relevant work experience do you have?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Less than 1 year', value: 'less-1' },
                        { label: '1 - 3 years', value: '1-3' },
                        { label: 'More than 3 years', value: 'more-3' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption('experience', opt.value)}
                          className={`p-3 text-sm rounded-xl border-2 font-medium ${responses.experience === opt.value
                              ? "border-brand-primary bg-brand-soft text-brand-primary"
                              : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience Recency */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Was this experience gained within the last 5 years?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Yes, fully recency', value: 'yes' },
                        { label: 'Partially within 5 yrs', value: 'partly' },
                        { label: 'No, longer ago', value: 'no' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption('recency', opt.value)}
                          className={`p-3 text-sm rounded-xl border-2 font-medium ${responses.recency === opt.value
                              ? "border-brand-primary bg-brand-soft text-brand-primary"
                              : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      What is/was the primary type of this employment?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Full-time', value: 'full-time' },
                        { label: 'Part-time', value: 'part-time' },
                        { label: 'Casual', value: 'casual' },
                        { label: 'Self-employed', value: 'self-employed' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption('exp_type', opt.value)}
                          className={`p-3 text-sm rounded-xl border-2 font-medium ${responses.exp_type === opt.value
                              ? "border-brand-primary bg-brand-soft text-brand-primary"
                              : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: English Language */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-primary mb-6">
                  Which best describes your English language ability?
                </h2>
                <div className="grid gap-4">
                  {[
                    { label: 'I have IELTS 5 in each band (or equivalent test score)', value: 'ielts-5' },
                    { label: 'I may qualify for an exemption (e.g. passport holder of UK, US, CA, NZ, IE)', value: 'exemption' },
                    { label: 'I have not completed an approved English test yet', value: 'none' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('english', opt.value)}
                      className={`flex items-center justify-between p-5 rounded-xl border-2 text-left transition-all ${responses.english === opt.value
                          ? "border-brand-primary bg-brand-soft text-brand-primary shadow-sm"
                          : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                        }`}
                    >
                      <span className="font-medium text-base">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Qualifications */}
            {step === 5 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-primary mb-6">
                  Do you hold qualifications related to your nominated occupation?
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Yes, I hold related qualifications', value: 'yes' },
                    { label: 'No formal qualifications', value: 'no' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleSelectOption('has_qualification', opt.value);
                        if (opt.value === 'no') {
                          handleSelectOption('qualification_name', 'None');
                        }
                      }}
                      className={`flex items-center justify-center p-5 rounded-xl border-2 text-center transition-all font-semibold ${responses.has_qualification === opt.value
                          ? "border-brand-primary bg-brand-soft text-brand-primary shadow-sm"
                          : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                        }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                {responses.has_qualification === 'yes' && (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="block text-sm font-semibold text-gray-700">
                      Qualification Name (e.g. Diploma in IT, Bachelor of Nursing)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter qualification name..."
                      value={responses.qualification_name || ''}
                      onChange={(e) => handleSelectOption('qualification_name', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 6: Skills Assessment */}
            {step === 6 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-primary mb-6">
                  Do you currently hold a positive skills assessment?
                </h2>
                <div className="grid gap-4">
                  {[
                    { label: 'Yes, I hold a positive skills assessment for my occupation', value: 'yes' },
                    { label: 'No, but I may not require one', value: 'not-required' },
                    { label: 'No skills assessment has been conducted', value: 'no' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption('skills_assessment', opt.value)}
                      className={`flex items-center justify-between p-5 rounded-xl border-2 text-left transition-all ${responses.skills_assessment === opt.value
                          ? "border-brand-primary bg-brand-soft text-brand-primary shadow-sm"
                          : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                        }`}
                    >
                      <span className="font-medium text-base">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: Current Location */}
            {step === 7 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-primary mb-6">
                  Where are you currently located?
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Outside Australia', value: 'outside' },
                    { label: 'Inside Australia', value: 'australia' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleSelectOption('location', opt.value);
                        if (opt.value === 'outside') {
                          handleSelectOption('current_visa', 'N/A');
                        }
                      }}
                      className={`flex items-center justify-center p-5 rounded-xl border-2 text-center transition-all font-semibold ${responses.location === opt.value
                          ? "border-brand-primary bg-brand-soft text-brand-primary shadow-sm"
                          : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                        }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                {responses.location === 'australia' && (
                  <div className="space-y-3 animate-fadeIn">
                    <label className="block text-sm font-semibold text-gray-700">
                      What is your current Australian Visa Subclass?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { label: 'Student (500)', value: 'student' },
                        { label: 'Working Holiday (417/462)', value: 'working-holiday' },
                        { label: 'Visitor (600)', value: 'visitor' },
                        { label: 'Bridging Visa', value: 'bridging' },
                        { label: 'Temporary Work (482)', value: '482' },
                        { label: 'Other', value: 'other' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption('current_visa', opt.value)}
                          className={`p-3 text-xs rounded-xl border-2 font-semibold ${responses.current_visa === opt.value
                              ? "border-brand-primary bg-brand-soft text-brand-primary"
                              : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 8: Immigration History */}
            {step === 8 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-primary mb-4">
                  Immigration &amp; Compliance History
                </h2>
                <p className="text-gray-500 mb-6 text-sm">
                  Have you ever experienced any of the following? (Select all that apply)
                </p>

                <div className="grid gap-3 mb-6">
                  {[
                    { label: 'Had an Australian visa refused', value: 'refused' },
                    { label: 'Had an Australian visa cancelled', value: 'cancelled' },
                    { label: 'Applied for a Protection Visa in Australia', value: 'protection' },
                    { label: 'Held an Australian Bridging Visa', value: 'bridging' },
                    { label: 'None of the above', value: 'none' }
                  ].map((opt) => {
                    const isSelected = (responses.history || []).includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleToggleHistory(opt.value)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${isSelected
                            ? "border-brand-primary bg-brand-soft text-brand-primary shadow-sm font-semibold"
                            : "border-gray-100 hover:border-brand-primary/20 text-gray-700"
                          }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-5 h-5 text-brand-accent shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 9: Contact details Lead Capture Gating (Before Results) */}
            {step === 9 && (
              <div className="animate-fadeIn">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-6">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 font-semibold">
                    Please enter your contact details below to instantly view your eligibility results.
                  </p>
                </div>

                <h3 className="text-xl font-bold text-brand-primary mb-2">Get Your Detailed 482 Visa Report</h3>
                <p className="text-gray-600 mb-6 text-sm">Enter your details to save your results and get a free migration roadmap.</p>

                <form onSubmit={handleLeadFormSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Full Name</label>
                      <input
                        name="name"
                        placeholder="Full Name"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Email Address</label>
                      <input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Mobile Number</label>
                      <input
                        name="phone"
                        placeholder="Mobile Number"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Nominated Occupation</label>
                      <input
                        name="occupation"
                        defaultValue={responses.occupation === 'other' || responses.occupation === 'manual' ? '' : responses.occupation}
                        placeholder="e.g. Software Engineer"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none font-semibold text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Passport Country</label>
                      <input
                        name="passport_country"
                        placeholder="Passport Country"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Current Country</label>
                      <input
                        name="current_country"
                        placeholder="Current Country"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Employer Name (Optional)</label>
                    <input
                      name="employer"
                      placeholder="Employer Name (Leave blank if none)"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      name="consent"
                      required
                      className="mt-0.5 w-4.5 h-4.5 rounded border-gray-300 text-brand-accent focus:ring-brand-accent cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 leading-relaxed">
                      I consent to Migration Republic contacting me regarding my enquiry.
                    </span>
                  </label>

                  {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#e40229] hover:bg-[#e40229]/95 text-white py-6 text-lg font-semibold shadow-lg shadow-[#e40229]/20"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Save Details & View Results"}
                  </Button>
                </form>
              </div>
            )}

            {/* STEP 10: Display Assessment Results (Gated) */}
            {step === 10 && submitted && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
                  <h4 className="font-bold text-green-900">Thank you! Your assessment has been saved.</h4>
                  <p className="text-green-700 text-sm mt-1">Below are your Subclass 482 Skills in Demand Visa eligibility results:</p>
                </div>

                {/* 1. LIKELY ELIGIBLE */}
                {resultType === 'eligible' && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 bg-green-50 border-green-100 text-center">
                      <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
                      <h3 className="text-2xl font-bold text-green-900">Likely Eligible</h3>
                      <p className="text-green-700 text-sm mt-2 max-w-lg">
                        Based on your answers, you appear to have a strong preliminary pathway for a Subclass 482 Skills in Demand visa.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                      <h4 className="font-bold text-brand-primary border-b pb-2">Assessment Summary:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex gap-2 items-center">
                          <Check className="w-4 h-4 text-green-600 shrink-0" />
                          Employer sponsorship appears available.
                        </li>
                        <li className="flex gap-2 items-center">
                          <Check className="w-4 h-4 text-green-600 shrink-0" />
                          Occupation appears eligible.
                        </li>
                        <li className="flex gap-2 items-center">
                          <Check className="w-4 h-4 text-green-600 shrink-0" />
                          Relevant work experience appears sufficient.
                        </li>
                        <li className="flex gap-2 items-center">
                          <Check className="w-4 h-4 text-green-600 shrink-0" />
                          English requirement appears satisfied.
                        </li>
                        <li className="flex gap-2 items-center">
                          <Check className="w-4 h-4 text-green-600 shrink-0" />
                          No major eligibility concerns identified.
                        </li>
                      </ul>
                    </div>

                    <div className="text-center pt-4">
                      <Link
                        href="https://migrationrepublic.com.au/book-a-consultation/"
                        className="btn-primary inline-block bg-[#e40229] hover:bg-[#e40229]/95 text-white font-bold py-4 px-10 rounded-xl shadow-lg"
                      >
                        Book a Consultation
                      </Link>
                    </div>
                  </div>
                )}

                {/* 2. FURTHER ASSESSMENT REQUIRED */}
                {resultType === 'further' && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 bg-amber-50 border-amber-100 text-center">
                      <AlertTriangle className="w-16 h-16 text-amber-600 mb-4" />
                      <h3 className="text-2xl font-bold text-amber-900">Further Assessment Required</h3>
                      <p className="text-amber-700 text-sm mt-2 max-w-lg">
                        Based on your answers, you may still qualify for a Subclass 482 visa; however, additional assessment is required before eligibility can be confirmed.
                      </p>
                    </div>

                    {flags.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                        <h4 className="font-bold text-brand-primary border-b pb-2">Identified Compliance &amp; Review Items:</h4>
                        <ul className="space-y-3">
                          {flags.map((flag, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <AlertTriangle className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-center pt-4">
                      <Link
                        href="https://migrationrepublic.com.au/book-a-consultation/"
                        className="btn-primary inline-block bg-[#e40229] hover:bg-[#e40229]/95 text-white font-bold py-4 px-10 rounded-xl shadow-lg"
                      >
                        Request an Assessment
                      </Link>
                    </div>
                  </div>
                )}

                {/* 3. ALTERNATIVE EMPLOYER SPONSORED PATHWAY */}
                {resultType === 'alternative' && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 bg-blue-50 border-blue-100 text-center">
                      <Info className="w-16 h-16 text-blue-600 mb-4" />
                      <h3 className="text-2xl font-bold text-blue-900">Alternative Pathway Eligible</h3>
                      <p className="text-blue-700 text-sm mt-2 max-w-lg">
                        A standard Subclass 482 pathway may not currently be suitable. However, another employer-sponsored visa option may be available after further assessment.
                      </p>
                    </div>

                    <div className="text-center pt-4">
                      <Link
                        href="https://migrationrepublic.com.au/book-a-consultation/"
                        className="btn-primary inline-block bg-[#e40229] hover:bg-[#e40229]/95 text-white font-bold py-4 px-10 rounded-xl shadow-lg"
                      >
                        Discuss My Options
                      </Link>
                    </div>
                  </div>
                )}

                {/* 4. NOT CURRENTLY ELIGIBLE */}
                {resultType === 'ineligible' && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 bg-red-50 border-red-100 text-center">
                      <XCircle className="w-16 h-16 text-red-600 mb-4" />
                      <h3 className="text-2xl font-bold text-red-900">Not Currently Eligible</h3>
                      <p className="text-red-700 text-sm mt-2 max-w-lg">
                        Based on your answers, you may not currently meet one or more key requirements for a Subclass 482 Skills in Demand visa.
                      </p>
                    </div>

                    {flags.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                        <h4 className="font-bold text-brand-primary border-b pb-2">Key Areas of Concern:</h4>
                        <ul className="space-y-3">
                          {flags.map((flag, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                      This does not necessarily mean another Australian visa pathway is unavailable. A registered migration agent can assess your circumstances and advise on alternative visa options.
                    </p>

                    <div className="text-center pt-4">
                      <Link
                        href="https://migrationrepublic.com.au/book-a-consultation/"
                        className="btn-primary inline-block bg-[#e40229] hover:bg-[#e40229]/95 text-white font-bold py-4 px-10 rounded-xl shadow-lg"
                      >
                        Speak with a Migration Agent
                      </Link>
                    </div>
                  </div>
                )}

                <div className="pt-8 border-t border-gray-100 flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={resetTool}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Start Over
                  </Button>
                </div>
              </div>
            )}

          </div>

          {/* Footer Navigation (For steps 1-8) */}
          {step <= totalSteps && (
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
                className="text-gray-500 hover:text-brand-primary disabled:opacity-0"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-6"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
