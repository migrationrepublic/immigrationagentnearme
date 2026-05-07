"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Loader2, Search, Users, ExternalLink } from "lucide-react";
import { getToolLeadsAction } from "@/app/actions/admin";

export default function ToolLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      try {
        setError(null);
        const data = await getToolLeadsAction();
        setLeads(data || []);
      } catch (err: any) {
        console.error("Error fetching tool leads:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Tool Lead Submissions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Users who engaged with your interactive tools
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads..."
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Tool Leads
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {leads.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            PR Calculator
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {leads.filter((l) => l.tool_name === "PR Calculator").length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Other Tools
          </p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {leads.filter((l) => l.tool_name !== "PR Calculator").length}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 uppercase text-xs font-semibold border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Tool Used</th>
                <th className="px-6 py-4">Result Overview</th>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-red-500"
                  >
                    Error loading leads: {error}
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {lead.user_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lead.user_email}
                      </div>
                      {lead.user_phone && (
                        <div className="text-xs text-gray-400">
                          {lead.user_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${
                          lead.tool_name === "PR Calculator"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400"
                        }
                      `}
                      >
                        {lead.tool_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {lead.tool_name === "PR Calculator" ? (
                        <div className="font-bold text-navy-600 dark:text-blue-400">
                          {lead.results?.totalPoints} Points
                        </div>
                      ) : lead.tool_name === "Eligibility Checker" ? (
                        <div
                          className={`font-bold ${
                            lead.results?.status === "eligible"
                              ? "text-green-600"
                              : lead.results?.status === "warning"
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {lead.results?.status === "eligible"
                            ? "Eligible"
                            : lead.results?.status === "warning"
                              ? "Potential Issues"
                              : "Not Eligible"}
                        </div>
                      ) : lead.tool_name === "Visa Suggestion Quiz" ? (
                        <div className="text-gray-600">
                          {lead.results?.suggestions?.length || 0} Suggestions
                        </div>
                      ) : (
                        <div className="text-gray-500">View details</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(lead.created_at), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 ml-auto">
                        Details <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
