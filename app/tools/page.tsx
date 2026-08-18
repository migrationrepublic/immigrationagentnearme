"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ToolNavbar } from '@/components/tools/shared/tool-navbar';
import { Calculator, ClipboardCheck, MessageSquareQuote, ArrowRight, Building2, Receipt } from 'lucide-react';

const tools = [
  {
    id: 'business-sponsor-checker',
    title: 'Can My Business Sponsor?',
    badge: 'For Employers',
    description: 'Quick-check your business eligibility to sponsor overseas skilled workers under 482, 186, and 494.',
    icon: <Building2 className="w-7 h-7 text-blue-700" />,
    href: '/tools/business-sponsor-checker',
    color: 'bg-blue-50',
  },
  {
    id: 'sponsorship-cost-estimator',
    title: 'Sponsorship Cost Estimator',
    badge: 'Government Fees',
    description: 'Calculate itemised statutory government charges, nomination fees, SAF levies, and VACs.',
    icon: <Receipt className="w-7 h-7 text-emerald-600" />,
    href: '/tools/sponsorship-cost-estimator',
    color: 'bg-emerald-50',
  },
  {
    id: 'subclass-482-checker',
    title: 'Subclass 482 Eligibility',
    badge: 'Work Visa',
    description: 'Check candidate eligibility criteria for the Subclass 482 Skills in Demand Visa.',
    icon: <ClipboardCheck className="w-7 h-7 text-amber-600" />,
    href: '/tools/subclass-482-checker',
    color: 'bg-amber-50',
  },
  {
    id: 'pr-calculator',
    title: 'PR Score Calculator',
    badge: 'Skilled Migration',
    description: 'Calculate your points for Skilled Migration visas (189, 190, 491).',
    icon: <Calculator className="w-7 h-7 text-indigo-600" />,
    href: '/tools/pr-calculator',
    color: 'bg-indigo-50',
  },
  {
    id: 'eligibility-checker',
    title: 'General Eligibility Checker',
    badge: 'Quick Assessment',
    description: 'Find out if you meet the fundamental requirements for Australian immigration.',
    icon: <ClipboardCheck className="w-7 h-7 text-green-600" />,
    href: '/tools/eligibility-checker',
    color: 'bg-green-50',
  },
  {
    id: 'visa-quiz',
    title: 'Visa Suggestion Quiz',
    badge: 'Interactive Quiz',
    description: 'Not sure which visa subclass fits your goals? Take our quick quiz to find out.',
    icon: <MessageSquareQuote className="w-7 h-7 text-purple-600" />,
    href: '/tools/visa-quiz',
    color: 'bg-purple-50',
  },
];

export default function ToolsDirectoryPage() {
  return (
    <div className="min-h-screen bg-slate-50/50" suppressHydrationWarning>
      <ToolNavbar />

      {/* Header Section with Compact Spacing & Transparent Logo */}
      <div className="pt-8 pb-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <Link href="/" className="mb-3 group inline-block">
            <Image
              src="/images/logobgre.png"
              alt="Migration Republic Logo"
              width={70}
              height={70}
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </Link>

          <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-accent bg-brand-soft px-3 py-1 rounded-full mb-2 border border-brand-primary/10">
            Self-Serve Migration Portals
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-brand-primary tracking-tight mb-2 leading-tight">
            Migration Tools <span className="text-brand-accent">&amp;</span> Calculators
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Professional interactive calculators designed by Migration Republic to help you evaluate eligibility, points, and statutory costs.
          </p>
        </div>
      </div>

      {/* Tools Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group bg-white p-6 sm:p-7 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md hover:border-brand-primary/30 transition-all duration-300 flex flex-col justify-between relative"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className={`${tool.color} w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                    {tool.icon}
                  </div>
                  {tool.badge && (
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full group-hover:bg-brand-primary group-hover:text-white transition-colors">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-brand-primary mb-2 group-hover:text-brand-accent transition-colors">
                  {tool.title}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-6">
                  {tool.description}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-brand-primary group-hover:text-brand-accent transition-colors">
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Consultation Banner */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-primary">Need a formal case assessment?</h2>
            <p className="text-gray-600 text-xs sm:text-sm max-w-xl">
              While our tools provide accurate initial guidance, immigration law involves nuanced legal criteria. Book a session with our MARA Registered Migration Agents.
            </p>
          </div>
          <Link
            href="/pricing"
            className="btn-primary inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold bg-[#e40229] hover:bg-[#e40229]/95 text-white rounded-xl shadow-md whitespace-nowrap shrink-0"
          >
            Book a Consultation
          </Link>
        </div>
      </div>
    </div>
  );
}
