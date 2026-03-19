// app/sitemap.js
import { cities } from "@/data/cities";

export default function sitemap() {
  const cityPages = cities.map((city) => ({
    url: `https://immigrationagentnearme.com/${city.slug}`,
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
    ...cityPages,
  ];
}
