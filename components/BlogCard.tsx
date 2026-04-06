import Link from "next/link";
import Image from "next/image";
import { WPPost, getFeaturedImage, getAuthorName } from "@/lib/wordpress";
import { Calendar, User, ArrowRight } from "lucide-react";

interface BlogCardProps {
  post: WPPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const featuredImage = getFeaturedImage(post);
  const authorName = getAuthorName(post);
  const formattedDate = new Date(post.date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all duration-500 flex flex-col h-full"
    >
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={featuredImage || "/images/placeholder.jpg"}
          alt={post.title.rendered}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-4 left-4 bg-brand-accent text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider transform -translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          Latest News
        </div>
      </div>

      <div className="p-8 flex flex-col flex-grow">
        <div className="flex items-center gap-4 text-xs font-medium text-brand-gray/60 mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-brand-accent" />
            {formattedDate}
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span className="flex items-center gap-1 uppercase tracking-wider">
            <User className="w-3 h-3 text-brand-accent" />
            {authorName}
          </span>
        </div>

        <h3
          className="text-2xl font-bold text-brand-heading mb-4 group-hover:text-brand-primary transition-colors line-clamp-2 leading-tight"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />

        <div
          className="text-brand-gray/80 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
        />

        <div className="flex items-center text-brand-primary font-bold text-sm">
          Read Story
          <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
        </div>
      </div>
    </Link>
  );
}
