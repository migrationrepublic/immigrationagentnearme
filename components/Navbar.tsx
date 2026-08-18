"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, ChevronDown, MapPin, Menu, X, ChevronRight } from "lucide-react";
import { cities } from "@/data/cities";
import Image from "next/image";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isCitiesOpen, setIsCitiesOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md transition-all duration-300">
      {/* Top Banner */}
      <div className="bg-brand-heading text-white px-2 py-2 text-xs md:text-sm hidden md:block">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-accent" /> MARN:
              2516981
            </span>
            <span className="text-white/40">|</span>
            <span className="font-medium">MARA Registered Immigration Agents</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <span>Serving All of Australia</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto px-4 max-w-7xl h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group relative z-10 md:-mt-6 md:-mb-1">
          <div className="w-20 h-20 md:w-24 md:h-24 flex items-center mt-0 md:mt-5 justify-center shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/images/logobgre.png"
              alt="Migration Republic"
              width={120}
              height={120}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          <Link
            href="/visas"
            className="text-brand-heading font-semibold hover:text-brand-accent transition-colors text-sm"
          >
            Visas
          </Link>

          {/* Tools Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-brand-heading font-semibold hover:text-brand-accent transition-colors text-sm pb-1 cursor-pointer">
              Tools <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72 grid gap-1">
                <Link
                  href="/tools/business-sponsor-checker"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-primary/5 rounded-xl text-brand-heading font-medium transition-colors text-sm"
                >
                  Can My Business Sponsor?
                </Link>
                <Link
                  href="/tools/sponsorship-cost-estimator"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-primary/5 rounded-xl text-brand-heading font-medium transition-colors text-sm"
                >
                  Sponsorship Cost Estimator
                </Link>
                <Link
                  href="/tools/subclass-482-checker"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-primary/5 rounded-xl text-brand-heading font-medium transition-colors text-sm"
                >
                  Subclass 482 Checker
                </Link>
                <Link
                  href="/tools/pr-calculator"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-primary/5 rounded-xl text-brand-heading font-medium transition-colors text-sm"
                >
                  PR Points Calculator
                </Link>
                <Link
                  href="/tools/eligibility-checker"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-primary/5 rounded-xl text-brand-heading font-medium transition-colors text-sm"
                >
                  Eligibility Checker
                </Link>
                <Link
                  href="/tools/visa-quiz"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-primary/5 rounded-xl text-brand-heading font-medium transition-colors text-sm"
                >
                  Visa Suggestion Quiz
                </Link>
                <div className="pt-2 border-t border-gray-100 mt-1">
                  <Link
                    href="/tools"
                    className="flex items-center justify-between px-4 py-2 text-brand-accent font-bold hover:underline text-xs"
                  >
                    View All Calculators →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Cities Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-brand-heading font-semibold hover:text-brand-accent transition-colors text-sm pb-1 cursor-pointer">
              Cities <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-64 grid gap-1">
                {cities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-brand-primary/5 rounded-xl text-brand-heading font-medium transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-brand-primary" />
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/blog"
            className="text-brand-heading font-semibold hover:text-brand-accent transition-colors text-sm"
          >
            Blog
          </Link>

          <Link
            href="/#faq"
            className="text-brand-heading font-semibold hover:text-brand-accent transition-colors text-sm"
          >
            FAQ
          </Link>
          <a
            href="https://migrationrepublic.com.au/about/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-heading font-semibold hover:text-brand-accent transition-colors text-sm"
          >
            About
          </a>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <a
            href="https://migrationrepublic.com.au/book-a-consultation/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="bg-[#E40229] hover:bg-[#c90022] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-[0_6px_20px_rgba(228,2,41,0.45)] hover:shadow-[0_8px_25px_rgba(228,2,41,0.6)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
              Book Consultation
            </button>
          </a>

          {/* Hamburger Menu Icon */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 sm:p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-brand-heading border border-gray-200 transition-colors flex items-center justify-center lg:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-2xl animate-in slide-in-from-top duration-300 max-h-[85vh] overflow-y-auto">
          <div className="container mx-auto px-4 py-6 flex flex-col gap-3">
            <Link
              href="/visas"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-brand-heading font-bold text-base py-2.5 border-b border-gray-100 flex items-center justify-between"
            >
              Visas <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>

            {/* Tools Accordion */}
            <div className="border-b border-gray-100 pb-2">
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="w-full text-brand-heading font-bold text-base py-2.5 flex items-center justify-between cursor-pointer"
              >
                Tools
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isToolsOpen ? "rotate-180" : ""
                    }`}
                />
              </button>
              {isToolsOpen && (
                <div className="pl-4 flex flex-col gap-2 pt-1 pb-2">
                  <Link
                    href="/tools/business-sponsor-checker"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-semibold text-gray-600 hover:text-brand-accent py-1.5"
                  >
                    Can My Business Sponsor?
                  </Link>
                  <Link
                    href="/tools/sponsorship-cost-estimator"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-semibold text-gray-600 hover:text-brand-accent py-1.5"
                  >
                    Sponsorship Cost Estimator
                  </Link>
                  <Link
                    href="/tools/subclass-482-checker"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-semibold text-gray-600 hover:text-brand-accent py-1.5"
                  >
                    Subclass 482 Checker
                  </Link>
                  <Link
                    href="/tools/pr-calculator"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-semibold text-gray-600 hover:text-brand-accent py-1.5"
                  >
                    PR Points Calculator
                  </Link>
                  <Link
                    href="/tools/eligibility-checker"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-semibold text-gray-600 hover:text-brand-accent py-1.5"
                  >
                    Eligibility Checker
                  </Link>
                  <Link
                    href="/tools/visa-quiz"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-semibold text-gray-600 hover:text-brand-accent py-1.5"
                  >
                    Visa Suggestion Quiz
                  </Link>
                </div>
              )}
            </div>

            {/* Cities Accordion */}
            <div className="border-b border-gray-100 pb-2">
              <button
                onClick={() => setIsCitiesOpen(!isCitiesOpen)}
                className="w-full text-brand-heading font-bold text-base py-2.5 flex items-center justify-between cursor-pointer"
              >
                Cities
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCitiesOpen ? "rotate-180" : ""
                    }`}
                />
              </button>
              {isCitiesOpen && (
                <div className="pl-4 flex flex-col gap-2 pt-1 pb-2 max-h-48 overflow-y-auto">
                  {cities.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/${c.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-semibold text-gray-600 hover:text-brand-accent py-1.5 flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/blog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-brand-heading font-bold text-base py-2.5 border-b border-gray-100 flex items-center justify-between"
            >
              Blog <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link
              href="/#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-brand-heading font-bold text-base py-2.5 border-b border-gray-100 flex items-center justify-between"
            >
              FAQ <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>

            <a
              href="https://migrationrepublic.com.au/about/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-brand-heading font-bold text-base py-2.5 border-b border-gray-100 flex items-center justify-between"
            >
              About <ChevronRight className="w-4 h-4 text-gray-400" />
            </a>

            <div className="pt-3">
              <a
                href="https://migrationrepublic.com.au/book-a-consultation/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full block"
              >
                <button className="w-full bg-[#E40229] hover:bg-[#c90022] text-white font-bold text-base py-3 rounded-2xl shadow-[0_6px_20px_rgba(228,2,41,0.45)] text-center cursor-pointer">
                  Book A Consultation
                </button>
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
