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
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Your Results are Ready!
          </h2>
          <p className="text-gray-500 mt-2">
            See your personalized analysis below.
          </p>
        </div>

        {onComplete(responses)}

        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Start Over
          </Button>
          <Link
            href="https://migrationrepublic.com.au/book-a-consultation/"
            className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8"
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
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Step {currentStep + 1} of {steps.length}
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

      {/* Tool Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        <div className="p-8 md:p-12 flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-primary mb-4">
            {step.question}
          </h2>
          {step.description && (
            <p className="text-gray-500 mb-8 leading-relaxed">
              {step.description}
            </p>
          )}

          <div className="grid gap-4 mt-8">
            {step.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(step.id, option.value)}
                className={`flex items-center justify-between p-5 rounded-xl border-2 text-left transition-all group ${responses[step.id] === String(option.value)
                  ? "border-brand-primary bg-brand-soft text-brand-primary shadow-md"
                  : "border-gray-100 hover:border-brand-primary/20 hover:bg-brand-soft/50 text-gray-700"
                  }`}
              >
                <span className="font-medium text-lg">{option.label}</span>
                <ChevronRight
                  className={`w-5 h-5 transition-transform ${responses[step.id] === String(option.value)
                    ? "translate-x-1 text-brand-accent"
                    : "text-gray-300 group-hover:text-gray-400"
                    }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-gray-500 hover:text-brand-primary disabled:opacity-0"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {step.type === "input" && (
            <Button
              onClick={handleNext}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
