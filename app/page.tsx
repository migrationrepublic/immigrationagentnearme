import { cities, services } from "@/data/cities";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import WhyChooseUs from "@/components/WhyChooseUs";
import CityLinks from "@/components/CityLinks";
import FAQ from "@/components/FAQ";
import FloatingCTA from "@/components/FloatingCTA";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Immigration Agent Near Me | MARA Registered Agents Australia",
  description:
    "Find a registered immigration agent near you anywhere in Australia. Migration Republic's MARA agents serve Sydney, Melbourne, Brisbane, Perth & all major cities. Book a consultation.",
  alternates: {
    canonical: "https://immigrationagentnearme.com/",
  },
  openGraph: {
    title: "Immigration Agent Near Me Australia | Migration Republic",
    description:
      "MARA registered immigration agents serving all major Australian cities.",
    url: "https://immigrationagentnearme.com/",
    locale: "en_AU",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Services />
        <WhyChooseUs />
        <CityLinks />
        <FAQ />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
