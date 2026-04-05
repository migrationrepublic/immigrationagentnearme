import { getParsedContent, getAllSlugs } from "@/lib/getContent";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FAQ from "@/components/FAQ";
import FloatingCTA from "@/components/FloatingCTA";
import Footer from "@/components/Footer";
import TextRenderer from "@/components/TextRenderer";
import VisaServicesGrid from "@/components/VisaServicesGrid";
import PartnerSection from "@/components/PartnerSection";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateLocalBusinessSchema, generateFAQSchema, generateBreadcrumbSchema } from "@/lib/schema";

export function generateStaticParams() {
  const slugs = getAllSlugs().filter((s) => s !== "home");
  return slugs.map((slug) => ({
    city: slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const content = getParsedContent(city);

  if (!content) {
    return {
      title: "Immigration Agent Near Me",
      description: "Find a local immigration agent in Australia.",
    };
  }

  return {
    title: content.meta.title,
    description: content.meta.description,
    keywords: content.meta.focusKeyword,
    alternates: {
      canonical: `https://immigrationagentnearme.com/${city}`,
    },
    openGraph: {
      title: content.meta.title,
      description: content.meta.description,
      url: `https://immigrationagentnearme.com/${city}`,
      locale: "en_AU",
      type: "website",
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const content = getParsedContent(city);

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow pt-20">


        {/* Dynamic Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateLocalBusinessSchema(city, content)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(city)) }}
        />
        {content.faq && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema(content.faq)) }}
          />
        )}

        <Hero 
          city={{
            name: city.charAt(0).toUpperCase() + city.slice(1),
            state: "AU",
            h1: content.hero.h1,
            intro: content.hero.subheadline,
            slug: city
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

        {content.localKnowledge && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4 max-w-4xl">
               <TextRenderer content={content.localKnowledge} />
            </div>
          </section>
        )}

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

        {content.faq && <FAQ faqString={content.faq} cityName={city} />}
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
