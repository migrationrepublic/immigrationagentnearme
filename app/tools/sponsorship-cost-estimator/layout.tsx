import { ToolSeoContent } from "@/components/tools/shared/tool-seo-content";
import { toolMetadata } from "@/lib/tools/seo-data";

export const metadata = toolMetadata("sponsorship-cost-estimator");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeoContent slug="sponsorship-cost-estimator">{children}</ToolSeoContent>;
}
