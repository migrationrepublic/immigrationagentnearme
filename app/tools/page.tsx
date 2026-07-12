import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calculator, ClipboardCheck, MessageSquareQuote, ArrowRight } from 'lucide-react';

const tools = [
  {
    id: 'pr-calculator',
    title: 'PR Score Calculator',
    description: 'Calculate your points for Skilled Migration visas (189, 190, 491).',
    icon: <Calculator className="w-8 h-8 text-blue-600" />,
    href: '/tools/pr-calculator',
    color: 'bg-blue-50',
  },
  {
    id: 'eligibility-checker',
    title: 'Eligibility Checker',
    description: 'Find out if you meet the basic requirements for Australian immigration.',
    icon: <ClipboardCheck className="w-8 h-8 text-green-600" />,
    href: '/tools/eligibility-checker',
    color: 'bg-green-50',
  },
  {
    id: 'visa-quiz',
    title: 'Visa Suggestion Quiz',
    description: 'Not sure which visa to apply for? Take our quick quiz to find out.',
    icon: <MessageSquareQuote className="w-8 h-8 text-purple-600" />,
    href: '/tools/visa-quiz',
    color: 'bg-purple-50',
  },
  {
    id: 'subclass-482-checker',
    title: 'Subclass 482 Eligibility',
    description: 'Check your eligibility criteria for the Subclass 482 Skills in Demand Visa.',
    icon: <ClipboardCheck className="w-8 h-8 text-amber-600" />,
    href: '/tools/subclass-482-checker',
    color: 'bg-amber-50',
  },
];

export default function ToolsDirectoryPage() {
  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <div className="bg-brand-primary py-20 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <Link href="/" className="mb-10 block group">
            <div className="relative">
              <div className="absolute -inset-4 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
              <Image 
                src="/images/logobgwhite.jpg" 
                alt="Migration Republic Logo" 
                width={100} 
                height={100} 
                className="rounded-full border-4 border-white/20 relative"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
          </Link>
          
          <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Migration Tools <span className="text-brand-accent">&</span> Calculators
          </h1>
          <p className="text-brand-soft/80 text-xl max-w-2xl mx-auto font-medium">
            Professional interactive tools designed by Migration Republic to help you navigate Australian immigration with clarity.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20 -mt-16 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {tools.map((tool) => (
            <Link 
              key={tool.id} 
              href={tool.href}
              className="group bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 flex flex-col items-center text-center"
            >
              <div className={`${tool.color} w-24 h-24 rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform duration-500`}>
                {tool.icon}
              </div>
              <h3 className="text-2xl font-bold text-brand-primary mb-4">{tool.title}</h3>
              <p className="text-gray-500 mb-8 flex-1 leading-relaxed">
                {tool.description}
              </p>
              <div className="inline-flex items-center text-brand-accent font-bold group-hover:gap-3 transition-all">
                Try Tool <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-24 glass-card rounded-[3rem] p-10 md:p-20 flex flex-col md:flex-row items-center gap-16 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-soft rounded-full -mr-48 -mt-48 blur-3xl -z-10" />
          
          <div className="flex-1 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-8">Need a professional assessment?</h2>
            <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-xl">
              While our tools provide great estimates, immigration laws are complex and change frequently. 
              Book a session with our Registered Migration Agents for a comprehensive analysis of your case.
            </p>
            <Link href="/pricing" className="btn-primary inline-block text-center px-10 py-5 text-lg">
              Book a Consultation
            </Link>
          </div>
          <div className="hidden lg:block w-1/3 relative z-10 animate-float">
             <div className="aspect-square bg-brand-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3">
                <Calculator className="w-32 h-32 text-white" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
