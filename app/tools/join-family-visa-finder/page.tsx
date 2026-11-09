"use client";

import { ToolHeader } from "@/components/tools/shared/tool-header";
import { TOOL_SEO } from "@/lib/tools/seo-data";
import { VisaFinder } from "@/components/tools/visa-finder/visa-finder";

export default function JoinFamilyVisaFinderPage() {
  return (
    <div className="bg-slate-50/50 pb-8 sm:pb-10" suppressHydrationWarning>
      <ToolHeader
        badge="Join Family Visa Finder"
        title={TOOL_SEO["join-family-visa-finder"].h1}
        description={TOOL_SEO["join-family-visa-finder"].tagline}
      />
      <VisaFinder tool="family" />
    </div>
  );
}
