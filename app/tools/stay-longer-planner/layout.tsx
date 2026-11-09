import { ToolSeoContent } from "@/components/tools/shared/tool-seo-content";
import { toolMetadata } from "@/lib/tools/seo-data";

// Parameterised URLs are canonicalised to the base route by metadata.alternates
export const metadata = toolMetadata("stay-longer-planner");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeoContent slug="stay-longer-planner">{children}</ToolSeoContent>;
}
