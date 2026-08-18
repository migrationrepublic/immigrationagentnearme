"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { ToolData } from "@/lib/tools/types";
import { Button } from "@/components/ui/button";

interface MultiStepToolProps {
  tool: ToolData;
  onComplete: (responses: Record<string, string>) => React.ReactNode;
}

export function MultiStepTool({ tool, onComplete }: MultiStepToolProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const steps = tool.steps;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleOptionSelect = (stepId: string, value: string | number) => {
    setResponses((prev) => ({ ...prev, [stepId]: String(value) }));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setResponses({});
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto p-5 sm:p-8 bg-white rounded-2xl shadow-xs border border-gray-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Your Results are Ready!
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            See your personalized analysis below.
          </p>
        </div>

        {onComplete(responses)}

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <Button
            variant="outline"
            onClick={reset}
            className="flex items-center gap-2 w-full sm:w-auto justify-center rounded-xl"
          >
            <RotateCcw className="w-4 h-4" /> Start Over
          </Button>
          <Link
            href="https://migrationrepublic.com.au/book-a-consultation/"
            className="bg-[#e40229] hover:bg-[#e40229]/95 text-white font-bold px-6 py-2.5 rounded-xl text-center text-sm w-full sm:w-auto shadow-md"
          >
            Book Consultation
          </Link>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="max-w-3xl mx-auto" suppressHydrationWarning>
      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Step {currentStep + 1} of {steps.length}
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

      {/* Tool Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden min-h-[380px] flex flex-col">
        <div className="p-5 sm:p-8 flex-1">
          <h2 className="text-lg sm:text-2xl font-bold text-brand-primary mb-2">
            {step.question}
          </h2>
          {step.description && (
            <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
              {step.description}
            </p>
          )}

          <div className="grid gap-3 mt-4">
            {step.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(step.id, option.value)}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all group ${
                  responses[step.id] === String(option.value)
                    ? "border-brand-primary bg-brand-soft/80 text-brand-primary shadow-xs"
                    : "border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="font-semibold text-sm sm:text-base">{option.label}</span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    responses[step.id] === String(option.value)
                      ? "translate-x-1 text-brand-accent"
                      : "text-gray-300 group-hover:text-gray-400"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-4 sm:px-8 py-3.5 sm:py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-gray-500 hover:text-brand-primary disabled:opacity-0 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>

          {step.type === "input" && (
            <Button
              onClick={handleNext}
              className="bg-brand-primary hover:bg-brand-primary/90 text-xs font-bold rounded-xl px-5"
            >
              Next <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
