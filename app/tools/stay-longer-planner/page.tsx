"use client";

import { ToolHeader } from "@/components/tools/shared/tool-header";
import { TOOL_SEO } from "@/lib/tools/seo-data";
import { StayLongerPlanner } from "@/components/tools/stay-longer/stay-longer-planner";

export default function StayLongerPlannerPage() {
  return (
    <div className="bg-slate-50/50 pb-8 sm:pb-10" suppressHydrationWarning>
      <ToolHeader
        badge="Stay Longer Planner"
        title={TOOL_SEO["stay-longer-planner"].h1}
        description={TOOL_SEO["stay-longer-planner"].tagline}
      />
      <StayLongerPlanner />
    </div>
  );
}
