"use client";

import React from 'react';
import { ToolNavbar } from './tool-navbar';

interface ToolHeaderProps {
  title: string;
  description: string;
  badge?: string;
  hideNav?: boolean;
}

export function ToolHeader({ title, description, badge, hideNav = false }: ToolHeaderProps) {
  // Helper to keep key phrases clean and formatted
  const formatTitle = (rawTitle: string) => {
    const phrases = [
      "Eligibility Checker",
      "Points Calculator",
      "Selection Quiz",
      "Cost Estimator",
      "Quick-Check"
    ];

    for (const phrase of phrases) {
      if (rawTitle.includes(phrase)) {
        const parts = rawTitle.split(phrase);
        return (
          <>
            {parts[0]}
            <span className="inline-block">{phrase}</span>
            {parts[1]}
          </>
        );
      }
    }
    return rawTitle;
  };

  return (
    <>
      {!hideNav && <ToolNavbar />}

      <div className="pt-4 pb-4 sm:pt-6 sm:pb-6 text-center max-w-3xl mx-auto px-4">
        {badge && (
          <span className="inline-block text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold bg-brand-soft text-brand-primary px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full mb-2 border border-brand-primary/10">
            {badge}
          </span>
        )}

        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-brand-primary tracking-tight mb-1.5 sm:mb-2 leading-tight">
          {formatTitle(title)}
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
      </div>
    </>
  );
}
