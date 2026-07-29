import React from "react";

interface WPContentRendererProps {
  html: string;
}

export default function WPContentRenderer({ html }: WPContentRendererProps) {
  if (!html) return null;

  return (
    <div
      className="wp-content max-w-none text-brand-gray text-base sm:text-lg leading-relaxed antialiased
        [&>p]:mb-5 [&>p]:last:mb-0 [&>p]:leading-[1.75]
        [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:md:text-3xl [&>h2]:font-extrabold [&>h2]:text-brand-heading [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:border-l-4 [&>h2]:border-brand-accent [&>h2]:pl-4 [&>h2]:py-1.5 [&>h2]:bg-brand-primary/5 [&>h2]:rounded-r-xl
        [&>h3]:text-lg [&>h3]:sm:text-xl [&>h3]:font-bold [&>h3]:text-brand-heading [&>h3]:mb-3 [&>h3]:mt-6 [&>h3]:flex [&>h3]:items-center
        [&>ul]:space-y-3 [&>ul]:my-5 [&>ul]:bg-white/50 [&>ul]:p-4 [&>ul]:sm:p-6 [&>ul]:rounded-2xl [&>ul]:border [&>ul]:border-gray-100 [&>ul]:shadow-sm [&>ul]:list-disc [&>ul]:list-inside
        [&>ol]:space-y-3 [&>ol]:my-5 [&>ol]:bg-white/50 [&>ol]:p-4 [&>ol]:sm:p-6 [&>ol]:rounded-2xl [&>ol]:border [&>ol]:border-gray-100 [&>ol]:shadow-sm [&>ol]:list-decimal [&>ol]:list-inside
        [&>blockquote]:border-l-4 [&>blockquote]:border-brand-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-brand-primary [&>blockquote]:my-6 [&>blockquote]:text-base [&>blockquote]:sm:text-lg
        [&>figure]:my-6 [&>figure]:rounded-2xl [&>figure]:overflow-hidden [&>figure]:border [&>figure]:border-gray-100 [&>figure]:shadow-md
        [&_img]:w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4
        [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:overflow-x-auto [&_table]:block
        [&_td]:border [&_td]:border-gray-200 [&_td]:p-3 [&_td]:text-sm
        [&_th]:border [&_th]:border-gray-200 [&_th]:p-3 [&_th]:bg-gray-50 [&_th]:font-bold [&_th]:text-sm
        [&_a]:text-brand-accent [&_a]:font-semibold [&_a]:hover:underline [&_a]:decoration-brand-accent/30 [&_a]:underline-offset-4 [&_a]:transition-all
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
