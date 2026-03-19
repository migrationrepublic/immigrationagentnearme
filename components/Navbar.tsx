import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhoneCall, ShieldCheck, ChevronDown, MapPin } from "lucide-react";
import { cities } from "@/data/cities";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      {/* Top Banner */}
      <div className="bg-brand-heading text-white px-4 py-2 text-xs md:text-sm hidden md:block">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-brand-accent" /> MARN:
              2518961
            </span>
            <span className="text-white/60">|</span>
            <span>MARA Registered Immigration Agents</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Serving All of Australia</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto px-4 max-w-7xl h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/images/logobgwhite.jpg"
            alt="Migration Republic"
            width={80}
            height={80}
            className="rounded-full"
          />
          <div>
            <div className="text-xl font-extrabold text-brand-heading leading-tight group-hover:text-brand-accent transition-colors">
              Migration Republic
            </div>
            <div className="text-xs text-brand-gray font-medium uppercase tracking-widest hidden sm:block">
              Immigration near me
            </div>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <Link
            href="/#services"
            className="text-brand-heading font-semibold hover:text-brand-accent transition-colors text-sm"
          >
            Services
          </Link>

          {/* Cities Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-brand-heading font-semibold hover:text-brand-accent transition-colors text-sm pb-1">
              Cities <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-64 grid gap-1">
                {cities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-brand-primary/5 rounded-xl text-brand-heading font-medium transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-brand-primary" />
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/#faq"
            className="text-brand-heading font-semibold hover:text-brand-accent transition-colors text-sm"
          >
            FAQ
          </Link>
          <a
            href="https://migrationrepublic.com.au/about/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-heading font-semibold hover:text-brand-accent transition-colors text-sm"
          >
            About
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://migrationrepublic.com.au/book-a-consultation/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-brand-accent hover:bg-brand-accent/90 text-white rounded-full px-6 shadow-md shadow-brand-accent/20 hidden sm:flex">
              Book Consultation
            </Button>
          </a>
          {/* Mobile menu button could go here */}
        </div>
      </div>
    </nav>
  );
}
