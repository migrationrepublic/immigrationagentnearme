import { getPostBySlug, getPosts, getFeaturedImage, getAuthorName } from "@/lib/wordpress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WPContentRenderer from "@/components/WPContentRenderer";
import FloatingCTA from "@/components/FloatingCTA";
import Image from "next/image";
import { Calendar, User, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  const excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, "").trim();
  const featuredImage = getFeaturedImage(post);

  return {
    title: `${post.title.rendered} | Migration Republic Blog`,
    description: excerpt.substring(0, 160),
    openGraph: {
      title: post.title.rendered,
      description: excerpt.substring(0, 160),
      type: "article",
      url: `https://immigrationagentnearme.com/blog/${post.slug}`,
      images: featuredImage ? [{ url: featuredImage }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const featuredImage = getFeaturedImage(post);
  const authorName = getAuthorName(post);
  const formattedDate = new Date(post.date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title.rendered,
    image: featuredImage,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Migration Republic",
      logo: {
        "@type": "ImageObject",
        url: "https://immigrationagentnearme.com/images/logo.jpg",
      },
    },
    description: post.excerpt.rendered.replace(/<[^>]*>/g, "").substring(0, 160),
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow pt-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <article>
          {/* Article Header */}
          <section className="relative py-24 bg-brand-heading overflow-hidden">
            <div className="absolute inset-0 bg-brand-primary opacity-20" />
            <div className="container mx-auto px-4 relative z-10 max-w-4xl">
              <Link 
                href="/blog" 
                className="inline-flex items-center gap-2 text-white/60 hover:text-brand-accent transition-colors mb-12 font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Back to blog
              </Link>

              <h1 
                className="text-4xl md:text-6xl font-extrabold text-white mb-8 leading-tight"
                dangerouslySetInnerHTML={{ __html: post.title.rendered }}
              />

              <div className="flex flex-wrap items-center gap-6 text-white/70 text-sm md:text-base font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                    <User className="w-5 h-5" />
                  </div>
                  <span>{authorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-accent" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Clock className="w-5 h-5 text-brand-accent" />
                   <span>5 min read</span>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Image */}
          {featuredImage && (
            <div className="container mx-auto px-4 -mt-16 relative z-20 max-w-5xl">
              <div className="relative h-[25rem] md:h-[40rem] w-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                <Image
                  src={featuredImage}
                  alt={post.title.rendered}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* Article Content */}
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4 max-w-4xl">
              <WPContentRenderer html={post.content.rendered} />
            </div>
          </section>
        </article>

        {/* Similar Posts / Footer CTA */}
        <section className="py-24 bg-gray-50 border-t border-gray-100">
           <div className="container mx-auto px-4 text-center max-w-4xl">
              <h2 className="text-3xl font-extrabold text-brand-heading mb-6">Stay Informed About Australian Immigration</h2>
              <p className="text-brand-gray text-lg mb-12 italic">
                "Our mission is to simplify the complex world of migration, one client at a time."
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <a 
                  href="https://migrationrepublic.com.au/book-a-consultation/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-4 px-10 rounded-full transition-all shadow-xl shadow-brand-primary/20"
                >
                  Apply For A Visa
                </a>
                <Link 
                  href="/blog"
                  className="bg-white hover:bg-gray-50 text-brand-heading border border-gray-200 font-bold py-4 px-10 rounded-full transition-all shadow-sm"
                >
                  View All News
                </Link>
              </div>
           </div>
        </section>
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}

// Pre-render some popular posts at build time
export async function generateStaticParams() {
  const posts = await getPosts(10);
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
