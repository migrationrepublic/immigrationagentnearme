const WP_URL =
  "https://lightyellow-dogfish-784027.hostingersite.com/wp-json/wp/v2";

export interface WPPost {
  id: number;
  date: string;
  slug: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
      media_details?: {
        width: number;
        height: number;
      };
    }>;
    author?: Array<{
      name: string;
      avatar_urls?: Record<string, string>;
    }>;
  };
}

export async function getPosts(perPage = 10, page = 1): Promise<WPPost[]> {
  const res = await fetch(
    `${WP_URL}/posts?per_page=${perPage}&page=${page}&_embed`,
    {
      next: { revalidate: 3600 }, // Cache for 1 hour
    },
  );

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const res = await fetch(`${WP_URL}/posts?slug=${slug}&_embed`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return null;
  }

  const posts = await res.json();
  return posts.length > 0 ? posts[0] : null;
}

export function getFeaturedImage(post: WPPost): string | null {
  return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
}

export function getAuthorName(post: WPPost): string {
  return post._embedded?.author?.[0]?.name || "Migration Republic";
}
