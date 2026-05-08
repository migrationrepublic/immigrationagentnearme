import { getParsedContent } from "@/lib/getContent";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FAQ from "@/components/FAQ";
import FloatingCTA from "@/components/FloatingCTA";
import Footer from "@/components/Footer";
import TextRenderer from "@/components/TextRenderer";
import VisaServicesGrid from "@/components/VisaServicesGrid";
import PartnerSection from "@/components/PartnerSection";
import Services from "@/components/Services";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  generateLocalBusinessSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from "@/lib/schema";

export async function generateMetadata() {
  const data = getParsedContent("home");
  return {
    title: data?.meta.title || "Immigration Agent Near Me",
    description:
      data?.meta.description || "Find a registered immigration agent near you.",
    keywords: data?.meta.focusKeyword,
    alternates: {
      canonical: "https://immigrationagentnearme.com/",
    },
    openGraph: {
      title: data?.meta.title,
      description: data?.meta.description,
      url: "https://immigrationagentnearme.com/",
      locale: "en_AU",
      type: "website",
    },
  };
}

export default function Home() {
  const content = getParsedContent("home");

  if (!content) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow pt-20">
        {/* Dynamic Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateLocalBusinessSchema("home", content),
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbSchema("home")),
          }}
        />
        {content.faq && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateFAQSchema(content.faq)),
            }}
          />
        )}

        <Hero
          city={{
            name: "Australia",
            state: "AU",
            h1: content.hero.h1,
            intro: content.hero.intro,
            slug: "home",
            cta1: content.hero.cta1,
            cta2: content.hero.cta2,
            badges: content.hero.badges,
          }}
        />

        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            {content.intro && <TextRenderer content={content.intro} />}
          </div>
        </section>

        <section className="py-24 bg-brand-primary/5">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-brand-heading mb-6">
                Australian Visa Services We Assist With
              </h2>
              <p className="text-lg text-brand-gray">
                Our MARA-registered agents provide comprehensive support across all major Australian visa categories.
              </p>
            </div>
            {content.services && <Services content={content.services} />}
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <TextRenderer content={content.whyChooseUs} />
          </div>
        </section>

        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <TextRenderer content={content.locations} />
          </div>
        </section>

        <section className="py-24 bg-white border-y border-gray-100">
          <div className="container mx-auto px-4 max-w-5xl">
            <TextRenderer content={content.howItWorks} />
          </div>
        </section>

        <section className="py-24 bg-brand-primary/[0.02]">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <TextRenderer content={content.testimonials} />
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-brand-heading mb-6">
                Popular Australian Visa Pathways
              </h2>
              <p className="text-lg text-brand-gray">
                Explore the most common visa options for skilled professionals, families, and businesses.
              </p>
            </div>
            {content.visaPathways && <Services content={content.visaPathways} />}
          </div>
        </section>

        <VisaServicesGrid />
        <PartnerSection />

        <section className="py-24 bg-brand-primary text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <TextRenderer content={content.cta} />
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
               <a 
                href="https://migrationrepublic.com.au/book-a-consultation/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-accent hover:bg-brand-accent/90 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:-translate-y-1"
               >
                 Book Consultation
               </a>
               <Link 
                href="/tools/visa-quiz"
                className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-10 py-4 rounded-full font-bold text-lg transition-all hover:-translate-y-1"
               >
                 Free Assessment
               </Link>
            </div>
          </div>
        </section>

        {content.faq && (
          <section className="py-24 bg-gray-50">
            <div className="container mx-auto px-4 max-w-4xl">
              <FAQ faqString={content.faq} />
            </div>
          </section>
        )}
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
