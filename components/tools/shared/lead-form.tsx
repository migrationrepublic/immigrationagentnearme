"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { submitToolLead } from '@/app/actions/tools';
import { Loader2 } from 'lucide-react';

interface LeadFormProps {
  toolName: string;
  results: any;
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
    <div className="bg-brand-soft border border-gray-100 rounded-xl p-6 md:p-8 mt-6">
      <h3 className="text-xl font-bold text-brand-primary mb-2">Get Your Detailed Report</h3>
      <p className="text-gray-600 mb-6">Enter your details to save your results and get a free migration roadmap.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Full Name"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
          />
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
          />
        </div>
        <input
          name="phone"
          placeholder="Phone Number (Optional)"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
        />
        
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white py-6 text-lg font-semibold shadow-lg shadow-brand-accent/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Save My Results"}
        </Button>
      </form>
    </div>
  );
}
