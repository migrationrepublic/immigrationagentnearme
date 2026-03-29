import React from 'react';
import { EXTERNAL_LINKS } from '@/lib/links';
import { ExternalLink, ShieldCheck, Award, Users2 } from 'lucide-react';

export default function PartnerSection() {
  return (
    <section className="py-24 bg-brand-primary/5">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
             <div className="inline-flex items-center space-x-2 bg-brand-primary/10 px-4 py-2 rounded-full text-brand-primary font-bold text-sm uppercase mb-6 tracking-wider">
               <ShieldCheck size={18} /> <span>Trusted Partners</span>
             </div>
             <h2 className="text-4xl md:text-5xl font-extrabold text-brand-heading mb-8 tracking-tight">
               Affiliated with Australia's Top Migration Firms
             </h2>
             <p className="text-xl text-brand-gray mb-10 leading-relaxed">
               We work exclusively with registered migration agents and established firms like <strong>Migration Republic</strong> to ensure you receive the most accurate and up-to-date immigration advice.
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
               <div className="flex items-start space-x-4">
                 <div className="mt-1 w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                   <Award className="text-brand-accent" size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold text-brand-heading text-lg">MARA Registered</h4>
                   <p className="text-brand-gray">Every agent we partner with is fully licensed and accredited.</p>
                 </div>
               </div>
               <div className="flex items-start space-x-4">
                 <div className="mt-1 w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                   <Users2 className="text-brand-accent" size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold text-brand-heading text-lg">10,000+ Successes</h4>
                   <p className="text-brand-gray">A combined track record of proven results across all visa classes.</p>
                 </div>
               </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-4">
               <a 
                 href={EXTERNAL_LINKS.migrationRepublic}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center justify-center px-8 py-5 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-primary/90 transition-all shadow-lg hover:shadow-brand-primary/20"
               >
                 Visit Migration Republic <ExternalLink className="ml-2" size={20} />
               </a>
               <a 
                 href={EXTERNAL_LINKS.australiaTrainingVisa}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center justify-center px-8 py-5 bg-white text-brand-primary border-2 border-brand-primary/20 font-bold rounded-2xl hover:border-brand-primary/40 transition-all shadow-sm"
               >
                 Australia Training Visa <ExternalLink className="ml-2" size={20} />
               </a>
             </div>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="relative group overflow-hidden rounded-3xl border-8 border-white shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-700">
               <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent z-10"></div>
               <img 
                 src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1476" 
                 alt="Professional Migration Agents" 
                 className="w-full h-[500px] object-cover group-hover:scale-110 transition-transform duration-1000"
               />
               <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-8 rounded-2xl border border-white/50 z-20 shadow-xl">
                  <p className="text-brand-heading font-extrabold text-2xl mb-2">Expert Advice You Can Count On</p>
                  <p className="text-brand-gray italic">"Connecting you with practitioners who live and breathe Australian immigration law."</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
