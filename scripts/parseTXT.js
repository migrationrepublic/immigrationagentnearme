const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, '../content');
const outputFile = path.join(__dirname, '../data/parsed-content.json');

const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.txt') && !f.includes('(1)'));

function extractValue(text, key) {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  let value = '';
  let found = false;
  // Match key followed by optional colon and spaces
  const keyRegex = new RegExp(`^(${key}):?\\s*`, 'i');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (keyRegex.test(line)) {
      found = true;
      value = line.replace(keyRegex, '').trim();
      // If it became empty, maybe the value is on the next line
      for (let j = i + 1; j < lines.length; j++) {
        const rawNextLine = lines[j];
        const nextLine = rawNextLine.trim();
        // Stop if we hit another key (Capital case followed by colon)
        // Must be at least 2 chars before colon to avoid single letters or noise
        if (/^[A-Z][A-Za-z0-9\s/]{2,}:/.test(nextLine)) break;
        // Stop if we hit a separator
        if (/^-{3,}|={3,}/.test(nextLine)) break;
        value += (value ? '\n' : '') + rawNextLine;
      }
      break;
    }
  }
  
  return value.trim();
}

function parseSection(text, sectionHeaderRegex) {
  // Matches a section between dashed lines
  const sectionRegex = new RegExp(`-+\\s*${sectionHeaderRegex}\\s*-+[\\r\\n]+([\\s\\S]*?)(?=[\\r\\n]+-+|$)`, 'i');
  const match = text.match(sectionRegex);
  return match ? match[1].trim() : '';
}

const parsedData = {};

files.forEach(file => {
  const filePath = path.join(contentDir, file);
  const rawText = fs.readFileSync(filePath, 'utf-8');

  let slug = file
    .replace('immigrationagentnearme_', '')
    .replace('_page_content.txt', '')
    .replace('_content.txt', '')
    .replace(/_/g, '-');

  if (slug === 'homepage') slug = 'home';

  // Extract sections with more flexible names
  const metaSection = parseSection(rawText, 'META\\s*/\\s*SEO');
  const heroSection = parseSection(rawText, 'HERO SECTION');
  const introSection = parseSection(rawText, 'INTRODUCTION.*');
  const whySection = parseSection(rawText, 'WHY.*');
  const servicesSection = parseSection(rawText, 'SERVICES.*');
  const localSection = parseSection(rawText, 'LOCAL KNOWLEDGE.*');
  const locationsSection = parseSection(rawText, 'LOCATIONS.*');
  const worksSection = parseSection(rawText, 'HOW IT WORKS.*');
  const testimonialsSection = parseSection(rawText, 'TESTIMONIALS.*');
  const faqSection = parseSection(rawText, 'FAQ.*');
  const ctaSection = parseSection(rawText, 'FINAL CTA.*');

  // Extract fine details
  parsedData[slug] = {
    slug,
    meta: {
      title: extractValue(metaSection, 'Meta Title'),
      description: extractValue(metaSection, 'Meta Description'),
      focusKeyword: extractValue(metaSection, 'Focus Keyword')
    },
    hero: {
      h1: extractValue(heroSection, 'H1|Headline|Heading'),
      subheadline: extractValue(heroSection, 'Subheadline'),
      cta1: extractValue(heroSection, 'CTA Button 1'),
      cta2: extractValue(heroSection, 'CTA Button 2'),
      trustBar: extractValue(heroSection, 'Trust(?: Line| Bar)')
    },
    intro: introSection,
    whyChooseUs: whySection,
    services: servicesSection,
    localKnowledge: localSection,
    locations: locationsSection,
    howItWorks: worksSection,
    testimonials: testimonialsSection,
    faq: faqSection,
    cta: ctaSection
  };
});

fs.writeFileSync(outputFile, JSON.stringify(parsedData, null, 2));
console.log(`Successfully parsed ${files.length} files into data/parsed-content.json`);
