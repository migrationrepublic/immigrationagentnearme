"use client";

import { ToolHeader } from "@/components/tools/shared/tool-header";
import { TOOL_SEO } from "@/lib/tools/seo-data";
import { VisaFinder } from "@/components/tools/visa-finder/visa-finder";

export default function PrPathwayExplorerPage() {
  return (
    <div className="bg-slate-50/50 pb-8 sm:pb-10" suppressHydrationWarning>
      <ToolHeader
        badge="PR Pathway Explorer"
        title={TOOL_SEO["pr-pathway-explorer"].h1}
        description={TOOL_SEO["pr-pathway-explorer"].tagline}
      />
      <VisaFinder tool="pr" />
    </div>
  );
}
