"use client";

import React, { useState } from 'react';
import { MultiStepTool } from '@/components/tools/shared/multi-step-tool';
import { eligibilityData } from '@/lib/tools/eligibility-data';
import { LeadForm } from '@/components/tools/shared/lead-form';
import { ToolHeader } from '@/components/tools/shared/tool-header';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export default function EligibilityCheckerPage() {
  const [submitted, setSubmitted] = useState(false);

  const calculateResults = (responses: Record<string, string>) => {
    let status = 'eligible';
    const issues: string[] = [];

    if (responses.passport === 'no') {
      status = 'warning';
      issues.push("You need a valid passport before you can apply for any visa.");
    }

    if (responses.age_limit === 'no') {
      status = 'not-eligible';
      issues.push("Most skilled visas require you to be under 45. You may need to look at Employer Sponsored or Global Talent paths.");
    }

    if (responses.character === 'no') {
      status = 'not-eligible';
      issues.push("A criminal record can significantly impact your character assessment for Australian visas.");
    }

    if (responses.skills_assessment === 'no') {
      status = 'warning';
      issues.push("A formal qualification or skills assessment is mandatory for skilled migration.");
    }

    if (!submitted) {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 font-semibold">
              Please enter your contact details below to instantly view your eligibility results.
            </p>
          </div>
          <LeadForm 
            toolName="Eligibility Checker" 
            results={{ status, issues }} 
            onSuccess={() => setSubmitted(true)} 
          />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
          <h4 className="font-bold text-green-900">Thank you! Your details have been submitted.</h4>
          <p className="text-green-700 text-sm mt-1">Below are your initial eligibility checker results:</p>
        </div>

        {/* Status Display */}
        <div className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 ${
          status === 'eligible' ? 'bg-green-50 border-green-100' : 
          status === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
        }`}>
          {status === 'eligible' && <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />}
          {status === 'warning' && <AlertTriangle className="w-16 h-16 text-amber-600 mb-4" />}
          {status === 'not-eligible' && <XCircle className="w-16 h-16 text-red-600 mb-4" />}
          
          <h3 className={`text-2xl font-bold ${
            status === 'eligible' ? 'text-green-900' : 
            status === 'warning' ? 'text-amber-900' : 'text-red-900'
          }`}>
            {status === 'eligible' ? 'Likely Eligible' : 
             status === 'warning' ? 'Potential Issues' : 'High Risk / Not Eligible'}
          </h3>
        </div>

        {/* Detailed Feedback */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-brand-primary">Our Assessment:</h4>
          {issues.length > 0 ? (
            <ul className="space-y-3">
              {issues.map((issue, idx) => (
                <li key={idx} className="flex gap-3 text-gray-700 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex-shrink-0 mt-1">
                    <AlertTriangle className="w-5 h-5 text-brand-accent" />
                  </div>
                  {issue}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              Based on your answers, you appear to meet the basic threshold for Australian migration. 
              The next step is to determine which specific visa subclass fits your profile best.
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Note:</strong> This tool checks for *basic* eligibility. Every visa subclass has its own specific 
            legal requirements which should be discussed with a professional.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-soft/30 py-12 px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto">
        <ToolHeader 
          title="Eligibility Checker" 
          description="Check if you meet the fundamental requirements to apply for an Australian visa."
        />

        <MultiStepTool 
          tool={eligibilityData} 
          onComplete={calculateResults} 
        />
      </div>
    </div>
  );
}
