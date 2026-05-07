import { Briefcase, Users, GraduationCap, ArrowUpRight, Plane, Landmark, Scale, BookOpen, Heart, School } from "lucide-react";
import Image from "next/image";

interface ServicesProps {
  content?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  "Skilled Migration": <Plane className="w-6 h-6" />,
  "Partner & Family": <Heart className="w-6 h-6" />,
  "Employer Sponsored": <Briefcase className="w-6 h-6" />,
  "Student Visas": <School className="w-6 h-6" />,
  "Parent Visas": <Users className="w-6 h-6" />,
  "Training & Graduate": <GraduationCap className="w-6 h-6" />,
  "Citizenship Assistance": <Landmark className="w-6 h-6" />,
  "Appeals & Complex": <Scale className="w-6 h-6" />,
};

const COLOR_MAP: Record<string, string> = {
  "Skilled Migration": "bg-blue-50 text-blue-600 group-hover:bg-blue-600",
  "Partner & Family": "bg-rose-50 text-rose-600 group-hover:bg-rose-600",
  "Employer Sponsored": "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600",
  "Student Visas": "bg-purple-50 text-purple-600 group-hover:bg-purple-600",
  "Parent Visas": "bg-orange-50 text-orange-600 group-hover:bg-orange-600",
  "Training & Graduate": "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600",
  "Citizenship Assistance": "bg-amber-50 text-amber-600 group-hover:bg-amber-600",
  "Appeals & Complex": "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600",
};

interface ServiceItem {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

export default function Services({ content }: ServicesProps) {
  let services: ServiceItem[] = [];

  if (content) {
    if (content.includes('H3: ')) {
      const blocks = content.split('H3: ').slice(1);
      services = blocks.map(block => {
        const lines = block.split('\n');
        const title = lines[0].trim();
        const desc = lines.slice(1).join(' ').trim();
        
        const key = Object.keys(ICON_MAP).find(k => title.includes(k)) || title;
        
        return {
          title,
          desc,
          icon: ICON_MAP[key] || <Plane className="w-6 h-6" />,
          color: COLOR_MAP[key] || "bg-brand-primary/5 text-brand-primary group-hover:bg-brand-primary",
        };
      });
    } else {
      // Handle list format: "- Title: Description"
      const lines = content.split('\n').filter(l => l.trim().startsWith('- '));
      services = lines.map(line => {
        const parts = line.trim().substring(2).split(': ');
        const title = parts[0];
        const desc = parts.slice(1).join(': ');
        
        const key = Object.keys(ICON_MAP).find(k => title.includes(k)) || title;
        
        return {
          title,
          desc,
          icon: ICON_MAP[key] || <Plane className="w-6 h-6" />,
          color: COLOR_MAP[key] || "bg-brand-primary/5 text-brand-primary group-hover:bg-brand-primary",
        };
      });
    }
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((service, index) => (
        <div 
          key={index}
          className="group block bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-primary/30 transition-all duration-300 relative overflow-hidden h-full flex flex-col"
        >
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
            <ArrowUpRight className="w-6 h-6 text-brand-primary" />
          </div>

          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:text-white ${service.color}`}>
            {service.icon}
          </div>
          
          <h3 className="text-2xl font-bold text-brand-heading mb-4 group-hover:text-brand-primary transition-colors">
            {service.title}
          </h3>
          
          <p className="text-brand-gray leading-relaxed flex-grow">
            {service.desc}
          </p>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center text-sm font-semibold text-brand-accent group-hover:text-brand-primary transition-colors">
            Learn More &rarr;
          </div>
        </div>
      ))}
    </div>
  );
}