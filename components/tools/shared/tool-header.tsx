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
  return (
    <div className="mb-12">
      <div className="flex flex-col items-center text-center">
        <Link href="/" className="mb-8 group">
          <div className="relative">
            <div className="absolute -inset-4 bg-brand-primary/5 rounded-full blur-xl group-hover:bg-brand-primary/10 transition-all"></div>
            <Image
              src="/images/logobgwhite.jpg"
              alt="Migration Republic Logo"
              width={120}
              height={120}
              className="relative rounded-full shadow-xl border-4 border-white"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        </Link>

        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-brand-primary/60 hover:text-brand-primary font-bold text-sm uppercase tracking-widest mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </Link>

        <h1 className="text-4xl md:text-6xl font-black text-brand-primary tracking-tight mb-4">
          {title}
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600 font-medium">
          {description}
        </p>

        <div className="mt-8 flex items-center gap-3 bg-brand-primary/5 px-6 py-2 rounded-full border border-brand-primary/10">
          <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Official Migration Tool</span>
        </div>
      </div>
    </div>
  );
}
