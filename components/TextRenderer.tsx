import React from 'react';
import { EXTERNAL_LINKS, INTERNAL_LINKS } from '@/lib/links';

interface TextRendererProps {
  content: string;
}

// Map keywords to their corresponding URLs for automatic linking
const LINK_MAP: Record<string, string> = {
  "Migration Republic": EXTERNAL_LINKS.migrationRepublic,
  "Subclass 482": EXTERNAL_LINKS.subclass482,
  "Subclass 186": EXTERNAL_LINKS.subclass186,
  "Subclass 494": EXTERNAL_LINKS.subclass494,
  "Subclass 189": EXTERNAL_LINKS.subclass189,
  "Subclass 190": EXTERNAL_LINKS.subclass190,
  "Subclass 403": EXTERNAL_LINKS.subclass403,
  "Subclass 870": EXTERNAL_LINKS.subclass870,
  "Subclass 820": EXTERNAL_LINKS.subclass820_801,
  "Subclass 801": EXTERNAL_LINKS.subclass820_801,
  "Subclass 300": EXTERNAL_LINKS.subclass300,
  "Subclass 309": EXTERNAL_LINKS.subclass309_100,
  "Subclass 100": EXTERNAL_LINKS.subclass309_100,
  "Subclass 200": EXTERNAL_LINKS.subclass200,
  "Subclass 201": EXTERNAL_LINKS.subclass201,
  "Aged Parent Visa": EXTERNAL_LINKS.agedParent804,
  "804 Visa": EXTERNAL_LINKS.agedParent804,
  "Australia Training Visa": EXTERNAL_LINKS.australiaTrainingVisa,
  "Sydney": INTERNAL_LINKS.sydney,
  "Melbourne": INTERNAL_LINKS.melbourne,
  "Brisbane": INTERNAL_LINKS.brisbane,
  "Perth": INTERNAL_LINKS.perth,
  "Adelaide": INTERNAL_LINKS.adelaide,
  "Gold Coast": INTERNAL_LINKS.goldCoast,
  "Canberra": INTERNAL_LINKS.canberra,
};

function linkify(text: string): string {
  let linkified = text;
  // Sort keys by length descending to avoid partial matches (e.g., "Subclass 482" before "482")
  const keys = Object.keys(LINK_MAP).sort((a, b) => b.length - a.length);
  
  keys.forEach(key => {
    const url = LINK_MAP[key];
    const isExternal = url.startsWith('http') && !url.includes('immigrationagentnearme.com');
    const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
    const className = "text-brand-accent font-semibold hover:underline decoration-brand-accent/30 underline-offset-4 transition-all";
    
    // Regex to match the key only if not already inside an <a> tag
    // This is a simple version; for complex cases, a proper parser is better
    const regex = new RegExp(`(?<!<a[^>]*>)\\b${key}\\b(?![^<]*</a>)`, 'gi');
    linkified = linkified.replace(regex, (match) => `<a href="${url}" ${target} class="${className}">${match}</a>`);
  });
  
  return linkified;
}

export default function TextRenderer({ content }: TextRendererProps) {
  if (!content) return null;

  const blocks = content.split('\n\n').filter((b) => b.trim() !== '');

  return (
    <div className="space-y-8 text-brand-gray text-lg leading-relaxed antialiased">
      {blocks.map((block, index) => {
        const text = block.trim();

        if (text.startsWith('H1: ') || text.startsWith('Headline: ')) {
          return (
            <h1 key={index} className="text-4xl md:text-5xl font-extrabold text-brand-heading mb-8 mt-16 leading-tight tracking-tight">
              {text.replace(/^(H1:|Headline:|Heading:)\s*/i, '')}
            </h1>
          );
        }

        if (text.startsWith('H2: ') || text.startsWith('Heading: ')) {
          return (
            <h2 key={index} className="text-3xl md:text-4xl font-extrabold text-brand-heading mb-8 mt-16 border-l-4 border-brand-accent pl-6 py-2 bg-brand-primary/5 rounded-r-2xl">
              {text.replace(/^(H2:|Heading:)\s*/i, '')}
            </h2>
          );
        }

        if (text.startsWith('H3: ') || text.startsWith('Subheading: ')) {
          return (
            <h3 key={index} className="text-2xl font-bold text-brand-heading mb-6 mt-12 flex items-center">
              <span className="w-2 h-2 bg-brand-accent rounded-full mr-3"></span>
              {text.replace(/^(H3:|Subheading:)\s*/i, '')}
            </h3>
          );
        }
        
        // Horizontal section dividers like --- SKILLED MIGRATION VISA ---
        if (text.startsWith('---') && text.endsWith('---')) {
           return (
             <div key={index} className="relative mt-20 mb-12">
               <div className="absolute inset-0 flex items-center" aria-hidden="true">
                 <div className="w-full border-t border-gray-200"></div>
               </div>
               <div className="relative flex justify-center">
                 <span className="bg-white px-6 text-sm font-black tracking-[0.2em] text-brand-primary uppercase">
                   {text.replace(/-/g, '').trim()}
                 </span>
               </div>
             </div>
           );
        }

        // List items
        if (text.startsWith('- ')) {
          const items = text.split('\n').filter((item) => item.trim() !== '');
          return (
            <ul key={index} className="space-y-4 my-8 bg-white/50 p-6 rounded-3xl border border-gray-50 shadow-sm">
              {items.map((item, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-brand-accent mr-3 font-bold text-xl leading-none mt-1.5 flex-shrink-0">•</span>
                  <span className="flex-grow" dangerouslySetInnerHTML={{ __html: linkify(item.replace(/^- /, '')) }} />
                </li>
              ))}
            </ul>
          );
        }

        // FAQ format "Q: ... \nA: ..."
        if (text.startsWith('Q: ')) {
           const lines = text.split('\n');
           const q = lines[0].replace('Q: ', '');
           const a = lines.slice(1).join(' ').replace('A: ', '');
           return (
             <div key={index} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mt-8 group hover:border-brand-primary/20 transition-all duration-300">
               <h4 className="text-xl font-bold text-brand-heading mb-4 group-hover:text-brand-primary transition-colors flex items-start">
                 <span className="text-brand-accent mr-2 flex-shrink-0">Q:</span>
                 {q}
               </h4>
               <div className="text-brand-gray flex items-start">
                 <span className="text-brand-primary/40 mr-2 font-bold flex-shrink-0">A:</span>
                 <p dangerouslySetInnerHTML={{ __html: linkify(a) }} />
               </div>
             </div>
           );
        }

        // Default Paragraph
        return (
          <p key={index} className="mb-6 last:mb-0 leading-[1.8]" dangerouslySetInnerHTML={{ __html: linkify(text) }} />
        );
      })}
    </div>
  );
}
