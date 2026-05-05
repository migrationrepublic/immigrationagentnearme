"use client";

import React, { useState } from 'react';
import { MultiStepTool } from '@/components/tools/shared/multi-step-tool';
import { visaQuizData } from '@/lib/tools/visa-quiz-data';
import { LeadForm } from '@/components/tools/shared/lead-form';
import { Sparkles, GraduationCap, Briefcase, Heart, Building2, Palmtree } from 'lucide-react';

export default function VisaQuizPage() {
  const [submitted, setSubmitted] = useState(false);

  const calculateResults = (responses: Record<string, any>) => {
    let suggestions: any[] = [];

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

    return (
      <div className="space-y-8">
        <h4 className="text-xl font-bold text-brand-primary">Based on your goals, we suggest exploring:</h4>
        
        <div className="grid gap-6">
          {suggestions.map((visa, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-soft rounded-xl flex items-center justify-center flex-shrink-0">
                {visa.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h5 className="text-lg font-bold text-brand-primary">{visa.name}</h5>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded">
                    {visa.type}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{visa.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {!submitted ? (
          <LeadForm 
            toolName="Visa Suggestion Quiz" 
            results={{ suggestions }} 
            onSuccess={() => setSubmitted(true)} 
          />
        ) : (
          <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
            <h4 className="font-bold text-green-900">Your preferences have been saved!</h4>
            <p className="text-green-700 text-sm mt-1">Our specialists will review your choices and send you more info on these visas.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-soft/30 py-12 px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-brand-primary tracking-tight mb-4">
            Visa Suggestion Quiz
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Find the right visa subclass based on your personal circumstances and migration goals.
          </p>
        </div>

        <MultiStepTool 
          tool={visaQuizData} 
          onComplete={calculateResults} 
        />
      </div>
    </div>
  );
}
