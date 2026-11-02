import { ToolSeoContent } from "@/components/tools/shared/tool-seo-content";
import { toolMetadata } from "@/lib/tools/seo-data";

export const metadata = {
  ...toolMetadata("visit-visa-finder"),
  // Parameterised URLs are canonicalised to the base route by metadata.alternates
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeoContent slug="visit-visa-finder">{children}</ToolSeoContent>;
}
