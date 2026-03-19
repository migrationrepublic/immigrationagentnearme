import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";

export default function FloatingCTA() {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-1000">
      <a href="https://migrationrepublic.com.au/book-a-consultation/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
        <div className="hidden md:block bg-white text-sm font-bold text-gray-900 px-4 py-2 rounded-full shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
          Book Consultation
        </div>
        <Button className="bg-brand-accent hover:bg-brand-primary text-white shadow-xl shadow-brand-accent/30 rounded-full w-16 h-16 flex items-center justify-center p-0 transition-transform group-hover:scale-110">
          <PhoneCall className="w-7 h-7 animate-pulse" />
        </Button>
      </a>
    </div>
  );
}