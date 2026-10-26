// app/sitemap.js
import { cities } from "@/data/cities";
import { TOOL_SEO } from "@/lib/tools/seo-data";

export default function sitemap() {
  const cityPages = cities.map((city) => ({
    url: `https://immigrationagentnearme.com/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const toolPages = Object.keys(TOOL_SEO).map((slug) => ({
    url: `https://immigrationagentnearme.com/tools/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: "https://immigrationagentnearme.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: "https://immigrationagentnearme.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://immigrationagentnearme.com/tools",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...toolPages,
    ...cityPages,
  ];
}
