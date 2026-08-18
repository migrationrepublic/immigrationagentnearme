"use client";

import React from 'react';
import { Info } from 'lucide-react';

interface ToolDisclaimerProps {
  customText?: string;
  extraClause?: string;
}

export function ToolDisclaimer({
  customText = "This is an indicative guide only, not a formal migration assessment, and it doesn’t guarantee any outcome — only the Department of Home Affairs approves a visa application. Book a consultation for a full assessment tailored to your circumstances.",
  extraClause,
}: ToolDisclaimerProps) {
  return (
    <div className="bg-blue-50/80 border border-blue-200/70 rounded-2xl p-4 sm:p-5 flex gap-3.5 items-start mt-6 text-left">
      <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
      <div className="text-xs text-blue-900 leading-relaxed space-y-1">
        <p>
          <strong>Mandatory Disclaimer:</strong> {customText}
        </p>
        {extraClause && (
          <p className="font-semibold text-blue-950">
            {extraClause}
          </p>
        )}
      </div>
    </div>
  );
}
