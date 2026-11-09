import Link from "next/link";
import { ArrowRight, Briefcase, CalendarClock, GraduationCap, Plane, Route, Users } from "lucide-react";
import { ToolHeader } from "@/components/tools/shared/tool-header";
import { TOOL_SEO } from "@/lib/tools/seo-data";
import { ToolDisclaimer } from "@/components/tools/shared/tool-disclaimer";

const FINDERS = [
  { href: "/tools/visit-visa-finder", title: "Visit and Tourism", desc: "Holidays, family visits, business trips, transit and working holidays.", icon: Plane },
  { href: "/tools/study-visa-finder", title: "Study", desc: "Full-time study, accompanying a student, or workplace training.", icon: GraduationCap },
  { href: "/tools/work-visa-finder", title: "Work", desc: "Skilled, temporary, business, working holiday and other work visas.", icon: Briefcase },
  { href: "/tools/join-family-visa-finder", title: "Join Family", desc: "Partner, parent, child, carer and other family visas.", icon: Users },
  { href: "/tools/pr-pathway-explorer", title: "Permanent Residence", desc: "Family, skilled, talent and other pathways to PR.", icon: Route },
  { href: "/tools/stay-longer-planner", title: "Stay Longer", desc: "Visa about to expire? Get a plan and a checklist.", icon: CalendarClock },
];

export default function VisaFinderHubPage() {
  return (
    <div className="bg-slate-50/50 pb-10">
      <ToolHeader
        badge="Visa Finder"
        title={TOOL_SEO["visa-finder"].h1}
        description={TOOL_SEO["visa-finder"].tagline}
      />
      <div className="max-w-4xl mx-auto px-3 sm:px-6 grid gap-4">
        {FINDERS.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex items-center gap-4 shadow-xs hover:shadow-md hover:border-brand-primary/30 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-brand-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-brand-primary group-hover:text-brand-accent transition-colors">{title}</h2>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-accent group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
        <ToolDisclaimer />
      </div>
    </div>
  );
}
