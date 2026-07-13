"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

interface ToolHeaderProps {
  title: string;
  description: string;
}

export function ToolHeader({ title, description }: ToolHeaderProps) {
  // Helper to keep key phrases together on one line
  const formatTitle = (rawTitle: string) => {
    const phrases = [
      "Eligibility Checker",
      "Points Calculator",
      "Selection Quiz"
    ];

    for (const phrase of phrases) {
      if (rawTitle.includes(phrase)) {
        const parts = rawTitle.split(phrase);
        return (
          <>
            {parts[0]}
            <span className="inline-block whitespace-nowrap">{phrase}</span>
            {parts[1]}
          </>
        );
      }
    }
    return rawTitle;
  };

  return (
    <div className="mb-12">
      <div className="flex flex-col items-center text-center">
        <Link href="/" className="mb-8 group">
          <div className="relative">
            <div className="absolute -inset-4 bg-brand-primary/5 rounded-full blur-xl group-hover:bg-brand-primary/10 transition-all"></div>
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden relative flex items-center justify-center bg-white">
              <Image
                src="/images/logobgwhite.jpg"
                alt="Migration Republic Logo"
                width={160}
                height={160}
                className="object-contain scale-140 transition-transform duration-500 group-hover:scale-150"
                priority
              />
            </div>
          </div>
        </Link>

        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-brand-primary/60 hover:text-brand-primary font-bold text-sm uppercase tracking-widest mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </Link>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-brand-primary tracking-tight mb-4 max-w-4xl">
          {formatTitle(title)}
        </h1>
        <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-600 font-medium leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
