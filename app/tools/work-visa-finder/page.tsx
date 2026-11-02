"use client";

import { ToolHeader } from "@/components/tools/shared/tool-header";
import { TOOL_SEO } from "@/lib/tools/seo-data";
import { VisaFinder } from "@/components/tools/visa-finder/visa-finder";

export default function WorkVisaFinderPage() {
  return (
    <div className="bg-slate-50/50 pb-8 sm:pb-10" suppressHydrationWarning>
      <ToolHeader
        badge="Work Visa Finder"
        title={TOOL_SEO["work-visa-finder"].h1}
        description={TOOL_SEO["work-visa-finder"].tagline}
      />
      <VisaFinder tool="work" />
    </div>
  );
}
