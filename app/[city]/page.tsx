import { notFound } from "next/navigation";
import { cities } from "@/data/cities";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";

// Generate static pages for all defined cities
export async function generateStaticParams() {
  return cities.map((city) => ({
    city: city.slug,
  }));
}

// Generate dynamic SEO metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const cityData = cities.find((c) => c.slug === city);

  if (!cityData) {
    return {
      title: "Not Found",
      description: "The page you are looking for does not exist.",
    };
  }

  return {
    title: cityData.metaTitle,
    description: cityData.metaDescription,
    alternates: {
      canonical: `https://immigrationagentnearme.com/${cityData.slug}`,
    },
    openGraph: {
      title: cityData.metaTitle,
      description: cityData.metaDescription,
      url: `https://immigrationagentnearme.com/${cityData.slug}`,
      locale: "en_AU",
      type: "website",
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cityData = cities.find((c) => c.slug === city);

  if (!cityData) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-20">
        <Hero city={cityData} />

        {/* Dynamic Content Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg max-w-none text-brand-gray">
              <h2 className="text-3xl font-bold text-brand-heading mb-6 border-b border-gray-100 pb-4">
                Immigration Agent Services in {cityData.name}, {cityData.state}
              </h2>

              <div className="grid md:grid-cols-2 gap-8 my-10">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <ShieldCheck className="w-10 h-10 text-brand-primary mb-4" />
                  <h3 className="text-xl font-bold text-brand-heading mb-3">
                    Skilled Migration — {cityData.name}
                  </h3>
                  <p className="mb-4 text-base">
                    Our agents assist {cityData.name} residents with state
                    nomination applications, skills assessments, and full
                    skilled visa lodgement (Subclass 189, 190, 491).
                  </p>
                  <a
                    href="https://migrationrepublic.com.au/migration/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-accent font-semibold flex items-center hover:underline transition-all"
                  >
                    View Skilled Visas <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </div>

                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <ShieldCheck className="w-10 h-10 text-brand-primary mb-4" />
                  <h3 className="text-xl font-bold text-brand-heading mb-3">
                    Employer Sponsored — {cityData.name}
                  </h3>
                  <p className="mb-4 text-base">
                    {cityData.name} businesses regularly sponsor overseas
                    workers. We assist both employers and sponsored employees
                    with Subclass 482 and 186 applications.
                  </p>
                  <a
                    href="https://migrationrepublic.com.au/subclass-482-visa-australia/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-accent font-semibold flex items-center hover:underline transition-all"
                  >
                    View Sponsored Visas <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-brand-heading mb-6 mt-16 border-b border-gray-100 pb-4">
                {cityData.name} Suburbs We Cover
              </h2>
              <p className="mb-8 font-medium">
                Migration Republic provides immigration agent services across
                all {cityData.name} suburbs and surrounding regions, including:
              </p>

              <div className="flex flex-wrap gap-3 mb-12">
                {cityData.suburbs.map((suburb) => (
                  <span
                    key={suburb}
                    className="bg-brand-primary/5 text-brand-primary border border-brand-primary/10 px-4 py-2 rounded-full font-medium"
                  >
                    {suburb}
                  </span>
                ))}
                <span className="bg-gray-100 text-gray-600 border border-gray-200 px-4 py-2 rounded-full font-medium italic">
                  and all surrounding {cityData.name} suburbs...
                </span>
              </div>
            </div>
          </div>
        </section>

        <WhyChooseUs cityName={cityData.name} />

        <FAQ cityName={cityData.name} stateCode={cityData.state} />

        {/* Other Cities Links (Internal Linking) */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h3 className="text-2xl font-bold text-brand-heading mb-8">
              Find an Immigration Agent in Other Cities
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {cities
                .filter((c) => c.slug !== cityData.slug)
                .map((otherCity) => (
                  <a
                    key={otherCity.slug}
                    href={`/${otherCity.slug}`}
                    className="px-6 py-3 bg-gray-50 hover:bg-brand-primary/5 border border-gray-200 hover:border-brand-primary/20 text-brand-heading font-semibold rounded-full transition-colors"
                  >
                    {otherCity.name}
                  </a>
                ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-brand-primary/5 py-24">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-heading mb-6">
              Book a Consultation in {cityData.name}
            </h2>
            <p className="text-lg text-brand-gray mb-10">
              Migration Republic&apos;s registered agents are ready to assess
            </p>
            <a
              href="https://migrationrepublic.com.au/book-a-consultation/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl shadow-brand-accent/20 text-lg"
            >
              Book Consultation <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingCTA />
    </div>
  );
}
