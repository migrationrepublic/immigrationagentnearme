import React from 'react';
import { VISA_SUBCLASSES } from '@/lib/links';
import { ArrowRight, ChevronRight, FileCheck, Users, Briefcase, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function VisaServicesGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-heading mb-6 tracking-tight">
            Our Specialist Visa Pathways
          </h2>
          <p className="text-xl text-brand-gray max-w-3xl mx-auto leading-relaxed">
            Connected with MARA-registered experts across every major Australian visa subclass.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {VISA_SUBCLASSES.map((visa, index) => (
            <a
              key={index}
              href={visa.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <FileCheck size={120} className="text-brand-primary" />
              </div>
              
              <div>
                <div className="w-14 h-14 bg-brand-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors duration-300">
                  <ArrowRight size={24} className="text-brand-primary group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-brand-heading mb-3 group-hover:text-brand-primary transition-colors">
                  {visa.name}
                </h3>
                <p className="text-brand-gray mb-6 leading-relaxed">
                  {visa.description}
                </p>
              </div>

              <div className="flex items-center text-brand-primary font-semibold text-sm uppercase tracking-wider group-hover:underline">
                View Detailed Guide <ChevronRight size={16} className="ml-1" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
