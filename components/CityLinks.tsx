import Link from "next/link";
import { cities } from "@/data/cities";
import { MapPin, ArrowRight } from "lucide-react";

export default function CityLinks() {
  return (
    <section className="py-24 bg-white relative overflow-hidden" id="locations">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-heading mb-6">
            Immigration Agents Near You — Cities We Serve
          </h2>
          <p className="text-lg text-brand-gray">
            Migration Republic provides registered immigration agent services across all major Australian cities. Select your city below to find an agent near you:
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {cities.map((city) => (
            <Link 
              key={city.slug} 
              href={`/${city.slug}`}
              className="group flex flex-col p-8 bg-white border border-gray-100 shadow-sm rounded-3xl hover:shadow-xl hover:border-brand-primary/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors">
                    {city.name}
                  </h3>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-brand-accent transition-colors group-hover:translate-x-1 duration-300" />
              </div>
              
              <div className="relative z-10">
                <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                  Immigration Agent {city.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {city.suburbs.slice(0, 4).map((suburb) => (
                    <span key={suburb} className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full border border-gray-100">
                      {suburb}
                    </span>
                  ))}
                  <span className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full border border-gray-100">
                    + more
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-brand-heading text-white rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white,_transparent)]" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Can&apos;t find your city?</h3>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              All consultations are also available online — contact us and we will connect you with the right agent regardless of your location. We provide full virtual visa service Australia-wide.
            </p>
            <a 
              href="https://migrationrepublic.com.au/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-white hover:text-brand-accent text-white font-semibold py-4 px-8 rounded-full transition-all duration-300"
            >
              Contact Us Online <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
