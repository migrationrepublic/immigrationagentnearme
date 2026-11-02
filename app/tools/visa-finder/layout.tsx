import { ToolSeoContent } from "@/components/tools/shared/tool-seo-content";
import { toolMetadata } from "@/lib/tools/seo-data";

export const metadata = toolMetadata("visa-finder");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeoContent slug="visa-finder">{children}</ToolSeoContent>;
}
