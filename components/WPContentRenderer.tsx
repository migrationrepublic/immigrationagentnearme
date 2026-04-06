import React from "react";

interface WPContentRendererProps {
  html: string;
}

export default function WPContentRenderer({ html }: WPContentRendererProps) {
  if (!html) return null;

  return (
    <div
      className="wp-content max-w-none text-brand-gray text-lg leading-relaxed antialiased
        [&>p]:mb-6 [&>p]:last:mb-0 [&>p]:leading-[1.8]
        [&>h2]:text-3xl [&>h2]:md:text-4xl [&>h2]:font-extrabold [&>h2]:text-brand-heading [&>h2]:mb-8 [&>h2]:mt-16 [&>h2]:border-l-4 [&>h2]:border-brand-accent [&>h2]:pl-6 [&>h2]:py-2 [&>h2]:bg-brand-primary/5 [&>h2]:rounded-r-2xl
        [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-brand-heading [&>h3]:mb-6 [&>h3]:mt-12 [&>h3]:flex [&>h3]:items-center
        [&>ul]:space-y-4 [&>ul]:my-8 [&>ul]:bg-white/50 [&>ul]:p-6 [&>ul]:rounded-3xl [&>ul]:border [&>ul]:border-gray-50 [&>ul]:shadow-sm [&>ul]:list-disc [&>ul]:list-inside
        [&>ol]:space-y-4 [&>ol]:my-8 [&>ol]:bg-white/50 [&>ol]:p-6 [&>ol]:rounded-3xl [&>ol]:border [&>ol]:border-gray-50 [&>ol]:shadow-sm [&>ol]:list-decimal [&>ol]:list-inside
        [&>blockquote]:border-l-4 [&>blockquote]:border-brand-primary [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-brand-primary [&>blockquote]:my-8 [&>blockquote]:text-xl
        [&>figure]:my-10 [&>figure]:rounded-3xl [&>figure]:overflow-hidden [&>figure]:border [&>figure]:border-gray-100 [&>figure]:shadow-md
        [&_img]:w-full [&_img]:h-auto [&_img]:rounded-2xl
        [&_a]:text-brand-accent [&_a]:font-semibold [&_a]:hover:underline [&_a]:decoration-brand-accent/30 [&_a]:underline-offset-4 [&_a]:transition-all
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
