"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export const TOOLS_NAV_ITEMS = [
  {
    name: 'Business Sponsor',
    href: '/tools/business-sponsor-checker',

  },
  {
    name: 'Cost Estimator',
    href: '/tools/sponsorship-cost-estimator',

  },
  {
    name: '482 Checker',
    href: '/tools/subclass-482-checker',
  },
  {
    name: 'PR Calculator',
    href: '/tools/pr-calculator',
  },
  {
    name: 'Eligibility',
    href: '/tools/eligibility-checker',
  },
  {
    name: 'Visa Quiz',
    href: '/tools/visa-quiz',
  },
];

export function ToolNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-0 sm:h-20 gap-2 sm:gap-4">

          {/* Logo & Home Link */}
          <div className="flex items-center justify-between shrink-0">
            <Link
              href="https://migrationrepublic.com.au"
              className="flex items-center group transition-transform duration-300"
            >
              <Image
                src="/images/logobgre.png"
                alt="Migration Republic"
                width={108}
                height={108}
                className="object-contain h-12 sm:h-16 w-auto"
                priority
              />
            </Link>

            <Link
              href="/tools"
              className="sm:hidden text-[11px] font-bold text-brand-primary hover:underline px-2.5 py-1 rounded-lg bg-gray-100"
            >
              All Tools
            </Link>
          </div>

          {/* Tools Switcher Nav Links (Smooth edge-to-edge touch horizontal scroll on mobile) */}
          <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs sm:text-sm -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {TOOLS_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 sm:py-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-gray-600 hover:text-brand-primary hover:bg-gray-100/90'
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
}
