"use client";

import React, { useState } from 'react';
import { MultiStepTool } from '@/components/tools/shared/multi-step-tool';
import { prCalculatorData } from '@/lib/tools/pr-calculator-data';
import { LeadForm } from '@/components/tools/shared/lead-form';
import { ToolHeader } from '@/components/tools/shared/tool-header';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function PRCalculatorPage() {
  const [submitted, setSubmitted] = useState(false);

  const calculateResults = (responses: Record<string, string>) => {
    let totalPoints = 0;
    const breakdown: { category: string; selection: string; points: number }[] = [];

    prCalculatorData.steps.forEach((step) => {
      const selectedValue = responses[step.id];
      const option = step.options?.find((o) => o.value === selectedValue);
      const points = option?.points || 0;
      totalPoints += points;
      
      breakdown.push({
        category: step.question,
        selection: option?.label || 'Not selected',
        points: points,
      });
    });

    return (
      <div className="space-y-8">
        {/* Score Display */}
        <div className="flex flex-col items-center justify-center p-8 bg-brand-soft rounded-2xl border-2 border-brand-primary/10">
          <span className="text-brand-primary/60 font-semibold uppercase tracking-widest text-sm mb-2">Your Estimated Score</span>
          <div className="text-7xl font-bold text-brand-primary">{totalPoints}</div>
          <span className="text-brand-primary/60 font-medium mt-2">Points</span>
        </div>

        {/* Feedback Section */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          {totalPoints >= 65 ? (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-green-600 w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-brand-primary">Good News!</h4>
                <p className="text-gray-600 text-sm mt-1">
                  You meet the minimum requirement of 65 points for most Australian skilled visas. 
                  However, higher points (85+) are often needed for an Invitation to Apply (ITA) in competitive occupations.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-amber-600 w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-brand-primary">Points Improvement Needed</h4>
                <p className="text-gray-600 text-sm mt-1">
                  The minimum requirement is usually 65 points. Consider improving your English score or 
                  gaining more work experience to boost your total.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Breakdown Table */}
        <div className="overflow-hidden border border-gray-100 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Your Selection</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {breakdown.map((item, idx) => (
                <tr key={idx} className="hover:bg-brand-soft/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-brand-primary">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.selection}</td>
                  <td className="px-6 py-4 text-sm font-bold text-brand-accent text-right">+{item.points}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-primary text-white font-bold">
              <tr>
                <td className="px-6 py-4" colSpan={2}>Estimated Total Points</td>
                <td className="px-6 py-4 text-right text-xl">{totalPoints}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {!submitted ? (
          <LeadForm 
            toolName="PR Calculator" 
            results={{ totalPoints, breakdown }} 
            onSuccess={() => setSubmitted(true)} 
          />
        ) : (
          <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
            <h4 className="font-bold text-green-900">Your results have been saved!</h4>
            <p className="text-green-700 text-sm mt-1">Our migration agents will review your profile and contact you soon.</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Disclaimer:</strong> This calculator provides an estimate based on your answers. 
            Official points are determined by the Department of Home Affairs and your Skills Assessment body.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-soft/30 py-12 px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto">
        <ToolHeader 
          title="PR Points Calculator" 
          description="Check your eligibility for Australian Permanent Residency (General Skilled Migration) in minutes."
        />

        <MultiStepTool 
          tool={prCalculatorData} 
          onComplete={calculateResults} 
        />
      </div>
    </div>
  );
}
