import { getPosts } from "@/lib/wordpress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import FloatingCTA from "@/components/FloatingCTA";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest Migration News & Expert Insights | Migration Republic",
  description:
    "Stay updated with the latest Australian immigration news, visa policy changes, and expert migration advice from our MARA registered agents.",
  openGraph: {
    title: "Migration News & Insights | Migration Republic",
    description: "Expert Australian immigration news and advice.",
    type: "website",
    url: "https://immigrationagentnearme.com/blog",
  },
};

export default async function BlogPage() {
  const posts = await getPosts(12);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow pt-20">
        {/* Blog Hero */}
        <section className="relative py-24 bg-brand-heading overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent opacity-50" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl -mr-48 -mt-48" />
          
          <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            <div className="inline-block px-4 py-2 bg-brand-accent/20 border border-brand-accent/30 rounded-full text-brand-accent text-sm font-bold uppercase tracking-[0.2em] mb-6">
              Migration Insights
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Latest <span className="text-brand-accent">Migration News</span> & Updates
            </h1>
            <p className="text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              Your trusted source for Australian immigration news, visa policy changes, 
              and professional guidance from registered migration experts.
            </p>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-7xl">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-100">
                <h3 className="text-2xl font-bold text-brand-heading mb-4">No stories found yet</h3>
                <p className="text-brand-gray">We're currently preparing some insightful migration news for you. Please check back soon.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
             <div className="bg-brand-primary rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-brand-primary/20">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mt-32" />
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-6">Need Professional Advice?</h2>
                  <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
                    Speak with our MARA registered agents today for a comprehensive evaluation of your visa options and a clear path forward.
                  </p>
                  <a 
                    href="https://migrationrepublic.com.au/book-a-consultation/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-brand-accent hover:bg-brand-accent/90 text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl shadow-brand-accent/30"
                  >
                    Book A Consultation
                  </a>
                </div>
             </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
