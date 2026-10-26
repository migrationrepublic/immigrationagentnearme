import { ToolSeoContent } from "@/components/tools/shared/tool-seo-content";
import { toolMetadata } from "@/lib/tools/seo-data";

export const metadata = toolMetadata("pr-calculator");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeoContent slug="pr-calculator">{children}</ToolSeoContent>;
}
