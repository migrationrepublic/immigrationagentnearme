export function generateLocalBusinessSchema(city: string, content: any) {
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "name": `Migration Registered Agent in ${cityName} — Migration Republic`,
    "description": content.meta.description,
    "url": `https://immigrationagentnearme.com/${city === 'home' ? '' : city}`,
    "telephone": "+61435321219",
    "email": "info@migrationrepublic.com.au",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressRegion": city === 'canberra' ? 'ACT' : 'Various',
      "addressCountry": "AU"
    },
    "geo": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "-33.8688", // Default values, in a perfect world these would be city-specific
        "longitude": "151.2093"
      },
      "geoRadius": "50000"
    },
    "areaServed": cityName,
    "serviceType": "Registered Migration Agent",
    "parentOrganization": {
      "@type": "Organization",
      "name": "Migration Republic",
      "url": "https://migrationrepublic.com.au"
    }
  };
}

export function generateFAQSchema(faqString: string) {
  if (!faqString) return null;
  
  const faqs = faqString.split('\n\n').filter(b => b.startsWith('Q: '));
  const mainEntity = faqs.map(faq => {
    const lines = faq.split('\n');
    const question = lines[0].replace('Q: ', '').trim();
    const answer = lines.slice(1).join(' ').replace('A: ', '').trim();
    return {
      "@type": "Question",
      "name": question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": answer
      }
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": mainEntity
  };
}

export function generateBreadcrumbSchema(slug: string) {
  const isHome = slug === 'home';
  const itemListElement = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://immigrationagentnearme.com/"
    }
  ];

  if (!isHome) {
    itemListElement.push({
      "@type": "ListItem",
      "position": 2,
      "name": slug.charAt(0).toUpperCase() + slug.slice(1),
      "item": `https://immigrationagentnearme.com/${slug}`
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": itemListElement
  };
}
