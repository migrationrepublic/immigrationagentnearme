import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  slug: string;
}

export default function Breadcrumbs({ slug }: BreadcrumbsProps) {
  const isHome = slug === 'home';
  const cityName = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <nav className="container mx-auto px-4 max-w-6xl py-4 flex items-center text-sm font-medium text-brand-gray/60" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/" className="hover:text-brand-primary transition-colors flex items-center gap-1.5">
            <Home size={14} />
            <span>Home</span>
          </Link>
        </li>
        
        {!isHome && (
          <>
            <li className="flex items-center text-gray-300">
              <ChevronRight size={14} />
            </li>
            <li className="flex items-center">
              <span className="text-brand-primary font-bold bg-brand-primary/5 px-2 py-0.5 rounded-md">
                {cityName}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
