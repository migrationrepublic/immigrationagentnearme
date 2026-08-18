"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { submitToolLead } from '@/app/actions/tools';
import { Loader2 } from 'lucide-react';

interface LeadFormProps {
  toolName: string;
  results: Record<string, unknown>;
  onSuccess: () => void;
}

export function LeadForm({ toolName, results, onSuccess }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      tool_name: toolName,
      user_name: formData.get('name') as string,
      user_email: formData.get('email') as string,
      user_phone: formData.get('phone') as string,
      results,
    };

    const res = await submitToolLead(data);

    if (res.success) {
      onSuccess();
    } else {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 sm:p-6 mt-6">
      <h3 className="text-lg font-bold text-brand-primary mb-1">Get Your Detailed Report</h3>
      <p className="text-gray-500 text-xs sm:text-sm mb-4">Enter your details to save your results and get a free migration roadmap.</p>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">Full Name *</label>
            <input
              name="name"
              placeholder="Full Name *"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">Email Address *</label>
            <input
              name="email"
              type="email"
              placeholder="Email Address *"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600">Contact Number *</label>
          <input
            name="phone"
            type="tel"
            placeholder="Contact Number *"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-sm bg-white"
          />
        </div>
        
        {error && <p className="text-red-500 text-xs">{error}</p>}

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#e40229] hover:bg-[#e40229]/95 text-white py-4 text-sm sm:text-base font-bold shadow-md rounded-xl active:scale-[0.99] transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save My Results & Unlock Analysis"}
        </Button>
      </form>
    </div>
  );
}
