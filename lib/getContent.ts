import contentData from "@/data/parsed-content.json";

export interface PageContent {
  slug: string;
  meta: {
    title: string;
    description: string;
    focusKeyword: string;
  };
  hero: {
    h1: string;
    subheadline: string;
    cta1: string;
    cta2: string;
    trustBar: string;
  };
  intro: string;
  whyChooseUs: string;
  services: string;
  localKnowledge: string;
  locations: string;
  howItWorks: string;
  testimonials: string;
  faq: string;
  cta: string;
}

export function getParsedContent(slug: string): PageContent | null {
  const data = (contentData as Record<string, PageContent>)[slug];
  if (!data) return null;
  return data;
}

export function getAllSlugs(): string[] {
  return Object.keys(contentData);
}
