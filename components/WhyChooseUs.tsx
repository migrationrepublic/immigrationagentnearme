import { Shield, BookOpen, Clock, FileCheck, Landmark, Star, Handshake, MapPin } from "lucide-react";
import Image from "next/image";

interface WhyChooseUsProps {
  cityName?: string;
}

export default function WhyChooseUs({ cityName }: WhyChooseUsProps = {}) {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-brand-primary/5 relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute -left-32 -top-32 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-heading mb-6 tracking-tight">
            What Is a MARA Registered Immigration Agent?
          </h2>
          <p className="text-lg text-brand-gray leading-relaxed mb-6">
            A <strong>MARA registered migration agent</strong> is a professional who has been formally authorised by the Australian Government to provide immigration advice and assistance. All registered agents must meet strict educational requirements, pass a professional year exam, hold current registration, and complete ongoing professional development to stay current with Australian immigration law.
          </p>
          <p className="text-lg text-brand-gray leading-relaxed bg-white/50 p-6 rounded-2xl border border-gray-100 shadow-sm">
            <a href="https://migrationrepublic.com.au/" className="text-brand-primary font-bold hover:underline">Migration Republic</a> holds MARA registration number <strong>2518961</strong>. You can verify this registration directly on the <a href="https://www.mara.gov.au/" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-medium hover:underline">OMARA website</a> at any time. When you work with a registered agent, you are also protected by a formal code of conduct — giving you recourse if professional standards are not upheld.
          </p>
        </div>

        {/* Why You Need an Agent Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center text-brand-heading mb-12">
            Why You Need a Registered Immigration Agent {cityName ? `Near You in ${cityName}` : 'Near You'}
          </h2>
          <p className="text-center text-brand-gray max-w-2xl mx-auto mb-12">
            Australian immigration law is complex, frequently updated, and unforgiving of errors. A single missing document, incorrect form, or misunderstood requirement can result in visa refusal, significant delays, or financial loss.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Landmark />}
              title="Legal authorisation"
              desc="Only MARA registered agents can legally charge for migration advice in Australia."
            />
            <FeatureCard 
              icon={<BookOpen />}
              title="Up to date knowledge"
              desc="Immigration policies change regularly and your agent must know the latest rules."
            />
            <FeatureCard 
              icon={<Star />}
              title="Higher approval rates"
              desc="Professionally prepared applications are significantly less likely to be refused."
            />
            <FeatureCard 
              icon={<FileCheck />}
              title="GTE and statement support"
              desc="Agents help you present your case compellingly to visa officers."
            />
            <FeatureCard 
              icon={<Clock />}
              title="End to end management"
              desc="From eligibility assessment to document preparation, lodgement and follow up."
            />
            <FeatureCard 
              icon={<Handshake />}
              title="Sponsor coordination"
              desc="For employer sponsored and training visas, agents manage both sides of the process."
            />
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl z-0" />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-brand-heading mb-6">
                Why Choose Migration Republic {cityName ? `in ${cityName}` : ''}
              </h2>
              <p className="text-brand-gray mb-8">
                Migration Republic is a registered Australian migration practice with a track record of successful visa outcomes across all major visa categories. Here is what sets us apart:
              </p>
              
              <ul className="space-y-4">
                {[
                  "MARN 2518961 — Fully registered and compliant with OMARA standards",
                  "98% approval rate — Across all visa applications lodged",
                  "500+ visas approved — Across skilled, employer sponsored, and training categories",
                  "Initial consultation — No obligation assessment of your case",
                  "Transparent fees — No hidden charges at any stage",
                  "24/7 support — Available when you need us, not just during business hours",
                  "Online and in-person — Serving clients across all of Australia"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-brand-primary/5 rounded-[2rem] -rotate-3 scale-105 transition-transform group-hover:rotate-0 duration-500" />
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white">
                <Image 
                  src="/images/why_choose_us_office.png" 
                  alt="Modern and professional Migration Republic office interior signifying trust and transparent immigration services"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/80 via-transparent to-transparent" />
                
                {/* Floating Achievement Badge */}
                <div className="absolute -left-8 top-12 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 animate-bounce transition-all [animation-duration:3s] z-20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Star className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">98% Success Rate</div>
                      <div className="text-xs text-gray-500">Top Rated Firm</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a 
                  href="https://migrationrepublic.com.au/book-a-consultation/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold py-4 px-8 rounded-full transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  Book Your Consultation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="w-12 h-12 bg-brand-primary/5 text-brand-primary rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-brand-gray text-sm leading-relaxed">{desc}</p>
    </div>
  );
}