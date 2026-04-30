import { getParsedContent } from "@/lib/getContent";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FAQ from "@/components/FAQ";
import FloatingCTA from "@/components/FloatingCTA";
import Footer from "@/components/Footer";
import TextRenderer from "@/components/TextRenderer";
import VisaServicesGrid from "@/components/VisaServicesGrid";
import PartnerSection from "@/components/PartnerSection";
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
            intro: content.hero.subheadline,
            slug: "home",
          }}
        />

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            {content.intro && <TextRenderer content={content.intro} />}
            {content.services && <TextRenderer content={content.services} />}
          </div>
        </section>

        <section className="py-20 bg-brand-primary/5">
          <div className="container mx-auto px-4 max-w-4xl">
            <TextRenderer content={content.whyChooseUs} />
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <TextRenderer content={content.locations} />
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <TextRenderer content={content.howItWorks} />
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <TextRenderer content={content.testimonials} />
          </div>
        </section>

        <VisaServicesGrid />
        <PartnerSection />

        {content.faq && <FAQ faqString={content.faq} />}
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
