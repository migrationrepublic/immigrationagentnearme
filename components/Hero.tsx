import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, MapPin, Briefcase } from "lucide-react";
import Image from "next/image";
import Breadcrumbs from "./Breadcrumbs";


interface HeroProps {
  city?: {
    name: string;
    state: string;
    h1: string;
    intro: string;
    slug: string;
    cta1?: string;
    cta2?: string;
    badges?: string[];
  };
}

export default function Hero({ city }: HeroProps = {}) {
  const defaultBadges = [
    "MARA Registered",
    "Australia-Wide Service",
    "Fixed Fees",
    "Online Consultations"
  ];

  const badges = city?.badges || defaultBadges;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary/5 via-white to-brand-primary/10 pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Background Decorative Shapes */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-3xl" />
      <div className="absolute -left-32 -top-32 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {city?.slug && <Breadcrumbs slug={city.slug} />}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 mt-8">

          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-primary/20 text-brand-primary text-sm font-semibold mb-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <MapPin className="h-4 w-4" />
              {city?.name === "Australia" ? "Australia-Wide Support" : `Registered Agents in ${city?.name || "Australia"}`}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-brand-heading tracking-tight leading-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              {city?.h1 || (
                <>
                  Find a Registered <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
                    Immigration Agent
                  </span>{" "}
                  Near You in Australia
                </>
              )}
            </h1>

            <div className="text-lg md:text-xl text-brand-gray mb-8 space-y-4 max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <p className="leading-relaxed">
                {city?.intro || "Get trusted immigration advice from MARA-registered migration agents helping individuals, couples, students, and employers across Australia."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
              <a
                href="https://migrationrepublic.com.au/book-a-consultation/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white rounded-full px-8 h-14 text-lg shadow-lg shadow-brand-accent/20 transition-all hover:-translate-y-1"
                >
                  {city?.cta1 || "Book Consultation"} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <a
                href="https://migrationrepublic.com.au/free-visa-assessment/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-2 border-brand-primary text-brand-primary hover:bg-brand-primary/5 rounded-full px-8 h-14 text-lg transition-all hover:-translate-y-1"
                >
                  {city?.cta2 || "Free Visa Assessment"}
                </Button>
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 animate-in fade-in duration-700 delay-500">
              {badges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Main Visual */}
          <div className="flex-1 relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 w-full max-w-lg lg:max-w-none mx-auto lg:mx-0 mt-8 lg:mt-0">
            <div className="relative z-10 w-full aspect-square md:aspect-[4/3] lg:aspect-square rounded-[2rem] overflow-hidden shadow-2xl border-[8px] border-white/50 backdrop-blur-sm">
              <Image
                src="/images/hero_immigration_agent.png"
                alt="Professional MARA Registered Immigration Agent in Australia consulting with clients in a modern office"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent mix-blend-overlay" />
            </div>

            {/* Floating Badge */}
            <div className="absolute -left-6 top-1/4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 animate-bounce transition-all [animation-duration:3s] z-20 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    Legally Compliant
                  </div>
                  <div className="text-xs text-gray-500">Regulated Advice</div>
                </div>
              </div>
            </div>

            {/* Another Floating Badge */}
            <div className="absolute -right-6 bottom-1/4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 animate-pulse transition-all [animation-duration:4s] z-20 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    Affiliated with
                  </div>
                  <div className="text-xs text-gray-500 font-semibold text-brand-primary">Migration Republic</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
