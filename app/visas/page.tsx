import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { visaCategories } from '@/lib/visa-data';
import { ExternalLink, ShieldCheck, Globe, Users, Briefcase, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function VisasPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24">
        {/* Hero Section */}
        <div className="container mx-auto px-4 mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-bold mb-6">
            <ShieldCheck className="w-4 h-4" />
            MARA Registered Expertise
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-brand-heading mb-6">
            Australian Visa <span className="text-brand-accent">Subclasses</span>
          </h1>
          <p className="text-lg text-brand-gray max-w-2xl mx-auto leading-relaxed">
            Explore every Australian visa pathway. We are Migration Republic, providing expert guidance across skilled, family, business, and humanitarian migration.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visaCategories.map((category, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-2"
              >
                <div className="w-14 h-14 bg-brand-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                   {getIconForCategory(category.title)}
                </div>
                
                <h2 className="text-2xl font-bold text-brand-heading mb-6">{category.title}</h2>
                
                <div className="space-y-4">
                  {category.links.map((link, lIdx) => (
                    <a 
                      key={lIdx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 border border-transparent hover:border-brand-primary/20 transition-all group/link"
                    >
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover/link:text-brand-primary transition-colors">
                        {link.name}
                      </span>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover/link:text-brand-primary group-hover/link:translate-x-1 transition-all" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 mt-32">
          <div className="bg-brand-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
                Unsure which visa is right for you?
              </h2>
              <p className="text-xl text-white/80 mb-12">
                Our registered migration agents will assess your eligibility and create a personalized roadmap to your Australian future.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link 
                  href="/tools/visa-quiz"
                  className="bg-brand-accent hover:bg-brand-accent/90 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:-translate-y-1"
                >
                  Take Visa Quiz
                </Link>
                <a 
                  href="https://migrationrepublic.com.au/book-a-consultation/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-10 py-4 rounded-full font-bold text-lg transition-all hover:-translate-y-1"
                >
                  Book Consultation
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function getIconForCategory(title: string) {
  if (title.includes('Employer')) return <Briefcase className="w-6 h-6" />;
  if (title.includes('Skill')) return <Globe className="w-6 h-6" />;
  if (title.includes('Partner')) return <Users className="w-6 h-6" />;
  if (title.includes('Student')) return <GraduationCap className="w-6 h-6" />;
  if (title.includes('Refugee')) return <ShieldCheck className="w-6 h-6" />;
  return <ShieldCheck className="w-6 h-6" />;
}
