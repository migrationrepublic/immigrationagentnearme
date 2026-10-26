import type { Metadata } from "next";
import { SITE_URL, TOOLS_INDEX_SEO } from "@/lib/tools/seo-data";

export const metadata: Metadata = {
  title: TOOLS_INDEX_SEO.metaTitle,
  description: TOOLS_INDEX_SEO.metaDescription,
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: {
    type: "website",
    siteName: "Migration Republic",
    title: TOOLS_INDEX_SEO.metaTitle,
    description: TOOLS_INDEX_SEO.metaDescription,
    url: `${SITE_URL}/tools`,
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
