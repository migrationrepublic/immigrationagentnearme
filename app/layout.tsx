import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: [
      {
        url: "/favicon_io/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon_io/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: "/favicon_io/apple-touch-icon.png",
  },
  manifest: "/favicon_io/site.webmanifest",
};

const schemaOrg = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: "Migration Republic",
  description: "MARA registered immigration agents serving all of Australia",
  url: "https://immigrationagentnearme.com",
  telephone: "+61435321219",
  email: "info@migrationrepublic.com.au",
  MARN: "2518961",
  areaServed: {
    "@type": "Country",
    name: "Australia",
  },
  serviceType: "Immigration Agent",
  sameAs: [
    "https://migrationrepublic.com.au",
    "https://facebook.com/migrationrepublicaus",
    "https://linkedin.com/company/migration-republic",
  ],
};

const schemaFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need a registered immigration agent in Australia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "While not mandatory, a MARA registered immigration agent ensures your application meets legal standards and maximises your chances of approval.",
      },
    },
    {
      "@type": "Question",
      name: "What is a MARA registered migration agent?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A MARA registered agent is legally authorised by the Office of the Migration Agents Registration Authority to provide immigration advice in Australia.",
      },
    },
    {
      "@type": "Question",
      name: "How do I find an immigration agent near me in Australia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Migration Republic's MARA registered agents serve all major Australian cities including Sydney, Melbourne, Brisbane, Perth and Adelaide. Contact us to book a consultation.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
