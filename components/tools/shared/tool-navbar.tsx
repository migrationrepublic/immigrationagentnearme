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
    <header className="sticky top-0 z-40 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 sm:h-28 gap-4">

          {/* Logo (Transparent, Exact 108px size, Perfectly aligned) */}
          <div className="flex items-center shrink-0">
            <Link
              href="https://migrationrepublic.com.au"
              className="flex items-center group transition-transform duration-300 group-hover:scale-105"
            >
              <Image
                src="/images/logobgre.png"
                alt="Migration Republic"
                width={108}
                height={108}
                className="object-contain h-20 sm:h-24 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </Link>
          </div>

          {/* Tools Switcher Nav Links */}
          <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-2 text-xs sm:text-sm">
            {TOOLS_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 sm:px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${isActive
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-gray-600 hover:text-brand-primary hover:bg-gray-100/90'
                    }`}
                >
                  <span>{item.name}</span>
                  {/* {item.badge && (
                    <span
                      className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${isActive
                        ? 'bg-brand-accent text-white'
                        : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                      {item.badge}
                    </span>
                  )} */}
                </Link>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
}
