import { ToolSeoContent } from "@/components/tools/shared/tool-seo-content";
import { toolMetadata } from "@/lib/tools/seo-data";

export const metadata = toolMetadata("eligibility-checker");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeoContent slug="eligibility-checker">{children}</ToolSeoContent>;
}
