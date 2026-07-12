"use client";

import React, { useState } from 'react';
import { MultiStepTool } from '@/components/tools/shared/multi-step-tool';
import { visaQuizData } from '@/lib/tools/visa-quiz-data';
import { LeadForm } from '@/components/tools/shared/lead-form';
import { ToolHeader } from '@/components/tools/shared/tool-header';
import { Sparkles, GraduationCap, Briefcase, Heart, Building2, Palmtree, Info } from 'lucide-react';

export default function VisaQuizPage() {
  const [submitted, setSubmitted] = useState(false);

  const calculateResults = (responses: Record<string, string>) => {
    const suggestions: { name: string; type: string; icon: React.ReactNode; desc: string }[] = [];

    if (responses.primary_goal === 'permanent') {
      suggestions.push({
        name: 'Skilled Independent (189)',
        type: 'Permanent',
        icon: <Briefcase className="w-6 h-6 text-blue-600" />,
        desc: 'For skilled workers who are not sponsored by an employer or family member.'
      });
      suggestions.push({
        name: 'Skilled Nominated (190)',
        type: 'Permanent',
        icon: <Building2 className="w-6 h-6 text-blue-600" />,
        desc: 'Requires nomination by an Australian state or territory government.'
      });
    } else if (responses.primary_goal === 'study') {
      suggestions.push({
        name: 'Student Visa (500)',
        type: 'Temporary',
        icon: <GraduationCap className="w-6 h-6 text-purple-600" />,
        desc: 'Allows you to stay in Australia to participate in a full-time course of study.'
      });
    } else if (responses.primary_goal === 'partner' || responses.partner_au === 'yes') {
      suggestions.push({
        name: 'Partner Visa (820/801)',
        type: 'Permanent (Path)',
        icon: <Heart className="w-6 h-6 text-red-600" />,
        desc: 'For partners or spouses of Australian citizens or permanent residents.'
      });
    } else if (responses.primary_goal === 'business') {
      suggestions.push({
        name: 'Business Innovation (188)',
        type: 'Provisional',
        icon: <Sparkles className="w-6 h-6 text-amber-600" />,
        desc: 'For people with business skills who want to establish or develop a business in Australia.'
      });
    } else if (responses.primary_goal === 'visitor') {
      suggestions.push({
        name: 'Visitor Visa (600)',
        type: 'Temporary',
        icon: <Palmtree className="w-6 h-6 text-green-600" />,
        desc: 'For people who want to visit Australia for tourism or business visitor activities.'
      });
    }

    const suggestionsForDb = suggestions.map(s => ({
      name: s.name,
      type: s.type,
      desc: s.desc
    }));

    if (!submitted) {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 font-semibold">
              Please enter your contact details below to instantly view your personalized visa recommendations.
            </p>
          </div>
          <LeadForm
            toolName="Visa Suggestion Quiz"
            results={{ suggestions: suggestionsForDb }}
            onSuccess={() => setSubmitted(true)}
          />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
          <h4 className="font-bold text-green-900">Thank you! Your preferences have been saved.</h4>
          <p className="text-green-700 text-sm mt-1">Below are the visa options matching your migration goals:</p>
        </div>

        <h4 className="text-xl font-bold text-brand-primary">Based on your goals, we suggest exploring:</h4>

        <div className="grid gap-6">
          {suggestions.map((visa, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start gap-4 sm:gap-5 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-soft rounded-xl flex items-center justify-center flex-shrink-0">
                {visa.icon}
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-1">
                  <h5 className="text-base sm:text-lg font-bold text-brand-primary leading-tight">{visa.name}</h5>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded w-fit">
                    {visa.type}
                  </span>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{visa.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-soft/30 py-12 px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto">
        <ToolHeader
          title="Visa Suggestion Quiz"
          description="Find the right visa subclass based on your personal circumstances and migration goals."
        />

        <MultiStepTool
          tool={visaQuizData}
          onComplete={calculateResults}
        />
      </div>
    </div>
  );
}
