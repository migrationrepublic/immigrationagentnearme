import Link from "next/link";
import { SITE_URL, TOOL_SEO } from "@/lib/tools/seo-data";

/**
 * Server-rendered SEO wrapper for a tool page: the interactive tool (children)
 * followed by an intro, how-to steps, FAQs and JSON-LD structured data.
 */
export function ToolSeoContent({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const t = TOOL_SEO[slug];
  const url = `${SITE_URL}/tools/${slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: t.keyword,
      url,
      description: t.metaDescription,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
      publisher: { "@type": "Organization", name: "Migration Republic", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: t.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/tools` },
        { "@type": "ListItem", position: 3, name: t.keyword, item: url },
      ],
    },
  ];

  return (
    <>
      {children}

      <section className="bg-white border-t border-gray-100 py-10 sm:py-14" aria-label={`About the ${t.keyword}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-brand-primary mb-3">
              About the {t.keyword}
            </h2>
            <div className="space-y-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              {t.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-brand-primary mb-4">
              {t.howToTitle}
            </h2>
            <ol className="space-y-3">
              {t.steps.map((s, i) => (
                <li key={s.name} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    <strong className="text-brand-primary">{s.name}.</strong> {s.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-brand-primary mb-4">
              {t.keyword} FAQs
            </h2>
            <div className="space-y-4">
              {t.faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="text-sm sm:text-base font-bold text-brand-primary mb-1">{f.q}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Looking for more?{" "}
            <Link href="https://migrationrepublic.com.au/immigration-tools-and-calculators/" className="font-semibold text-brand-primary hover:underline">
              Browse all migration tools
            </Link>{" "}
            or{" "}
            <Link href="https://migrationrepublic.com.au/book-a-consultation/" className="font-semibold text-brand-primary hover:underline">
              book a consultation
            </Link>{" "}
            with a MARA registered migration agent.
          </p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
