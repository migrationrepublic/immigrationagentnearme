import { ToolSeoContent } from "@/components/tools/shared/tool-seo-content";
import { toolMetadata } from "@/lib/tools/seo-data";

export const metadata = toolMetadata("subclass-482-checker");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeoContent slug="subclass-482-checker">{children}</ToolSeoContent>;
}
