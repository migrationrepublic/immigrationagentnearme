"use client"

import React, { useEffect, useState } from "react"
import { format } from "date-fns"
import { Loader2, Search, Users, ExternalLink, Wrench, X, Info, AlertTriangle, CheckCircle2, List } from "lucide-react"
import { getToolLeadsAction } from "@/app/actions/admin"

interface ToolLead {
  id: string
  user_name: string
  user_email: string
  user_phone?: string
  tool_name: string
  results?: Record<string, unknown>
  created_at: string
}

export default function ToolLeadsPage() {
  const [leads, setLeads] = useState<ToolLead[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<ToolLead | null>(null)

  useEffect(() => {
    async function fetchLeads() {
      try {
        setError(null)
        const data = await getToolLeadsAction()
        setLeads((data as ToolLead[]) || [])
      } catch (err) {
        console.error("Error fetching tool leads:", err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [])

  const filtered = leads.filter(l =>
    l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="admin-loader h-[60vh]">
        <Loader2 className="admin-loader-icon" />
      </div>
    )
  }

  const prCount    = leads.filter(l => l.tool_name === "PR Calculator").length
  const otherCount = leads.filter(l => l.tool_name !== "PR Calculator").length

  return (
    <div className="admin-page">
      {/* Title + search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="admin-heading flex items-center gap-2">
            <Users className="w-7 h-7" style={{ color: 'var(--color-admin-navy)' }} />
            Tool Lead Submissions
          </h1>
          <p className="admin-subheading">Users who engaged with your interactive tools</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-admin-muted)' }} />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-input pl-9 w-56"
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Tool Leads',  value: leads.length,  accent: 'admin-badge-navy' },
          { label: 'PR Calculator',     value: prCount,       accent: 'admin-badge-info' },
          { label: 'Other Tools',       value: otherCount,    accent: 'admin-badge-warn' },
        ].map((s, i) => (
          <div key={i} className="admin-card p-6 flex items-center justify-between group hover:shadow-md transition-all">
            <div>
              <p className="admin-label">{s.label}</p>
              <p className="admin-value mt-2">{s.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${s.accent}`}>
              <Wrench className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="admin-thead">
              <tr>
                <th>User</th>
                <th>Tool Used</th>
                <th>Result Overview</th>
                <th>Submitted At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-tbody">
              {error ? (
                <tr><td colSpan={5} className="admin-td text-center" style={{ color: 'var(--color-badge-error-text)' }}>Error loading leads: {error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="admin-td text-center" style={{ color: 'var(--color-admin-muted)' }}>No submissions yet.</td></tr>
              ) : (
                filtered.map(lead => (
                  <tr key={lead.id} className="admin-tr">
                    <td className="admin-td">
                      <span className="admin-cell-primary block">{lead.user_name}</span>
                      <span className="admin-cell-muted block">{lead.user_email}</span>
                      {lead.user_phone && <span className="admin-cell-muted block">{lead.user_phone}</span>}
                    </td>
                    <td className="admin-td">
                      <span className={`admin-badge ${lead.tool_name === "PR Calculator" ? "admin-badge-info" : "admin-badge-warn"}`}>
                        {lead.tool_name}
                      </span>
                    </td>
                    <td className="admin-td">
                      {lead.tool_name === "PR Calculator" ? (
                        <span className="admin-cell-primary">{(lead.results?.totalPoints as number | undefined) ?? '—'} Points</span>
                      ) : lead.tool_name === "Eligibility Checker" ? (
                        <span className={`font-bold text-sm ${
                          lead.results?.status === "eligible" ? "text-green-700"
                          : lead.results?.status === "warning" ? "text-amber-700"
                          : "text-red-700"
                        }`}>
                          {lead.results?.status === "eligible" ? "Eligible"
                           : lead.results?.status === "warning" ? "Potential Issues"
                           : "Not Eligible"}
                        </span>
                      ) : lead.tool_name === "Visa Suggestion Quiz" ? (
                        <span className="admin-cell-muted">{(lead.results?.suggestions as unknown[])?.length ?? 0} Suggestions</span>
                      ) : (
                        <span className="admin-cell-muted">View details</span>
                      )}
                    </td>
                    <td className="admin-td admin-cell-muted">
                      {format(new Date(lead.created_at), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="admin-td text-right">
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="admin-cell-primary flex items-center gap-1 text-xs ml-auto hover:underline font-bold" 
                        style={{ color: 'var(--color-admin-navy)' }}
                      >
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
      
      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white border rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E40229]">
                  Interactive Tool Submission Details
                </span>
                <h3 className="text-xl font-extrabold text-gray-800 mt-1">
                  {selectedLead.user_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Contents */}
            <div className="space-y-6 overflow-y-auto flex-1 pr-1 font-sans text-sm text-gray-700">
              
              {/* Contact Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Information</h4>
                  <div className="text-xs space-y-1">
                    <p><span className="font-semibold text-gray-500">Email: </span><a href={`mailto:${selectedLead.user_email}`} className="text-blue-600 hover:underline">{selectedLead.user_email}</a></p>
                    <p><span className="font-semibold text-gray-500">Phone: </span>{selectedLead.user_phone || "—"}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Submission Meta</h4>
                  <div className="text-xs space-y-1">
                    <p><span className="font-semibold text-gray-500">Tool Used: </span><span className="font-bold text-brand-primary">{selectedLead.tool_name}</span></p>
                    <p><span className="font-semibold text-gray-500">Submitted: </span>{format(new Date(selectedLead.created_at), "MMM d, yyyy h:mm a")}</p>
                  </div>
                </div>
              </div>

              {/* Assessment details */}
              <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 border-b pb-2">
                  <Info className="w-4 h-4 text-brand-primary" /> Assessment & Calculation Results
                </h4>

                {/* PR Points Calculator Results */}
                {(selectedLead.tool_name === "PR Calculator" || selectedLead.tool_name === "PR Points Calculator") && (
                  <div className="space-y-4">
                    <div className="bg-brand-soft border border-brand-primary/10 p-4 rounded-xl text-center">
                      <p className="text-xs font-bold text-gray-500 uppercase">Calculated PR Score</p>
                      <h3 className="text-3xl font-black text-brand-accent mt-1">
                        {(selectedLead.results?.totalPoints as number) ?? 0} Points
                      </h3>
                    </div>

                    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-500">
                          <tr>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5">User Selection</th>
                            <th className="px-4 py-2.5 text-right">Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(selectedLead.results?.breakdown as Array<{ category: string, selection: string, points: number }>)?.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 font-semibold text-brand-primary">{item.category}</td>
                              <td className="px-4 py-2.5 text-gray-600">{item.selection}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-brand-accent">+{item.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Eligibility Checker Results */}
                {selectedLead.tool_name === "Eligibility Checker" && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl text-center border font-bold text-sm ${
                      selectedLead.results?.status === "eligible" ? "bg-green-50 border-green-100 text-green-800"
                      : selectedLead.results?.status === "warning" ? "bg-amber-50 border-amber-100 text-amber-800"
                      : "bg-red-50 border-red-100 text-red-800"
                    }`}>
                      {selectedLead.results?.status === "eligible" ? "Likely Eligible for Skilled Visas"
                       : selectedLead.results?.status === "warning" ? "Needs Review / Potential Issues"
                       : "High Risk / Likely Not Eligible"}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Key Assessment Notes:</p>
                      <div className="space-y-2">
                        {(selectedLead.results?.issues as string[])?.length > 0 ? (
                          (selectedLead.results?.issues as string[]).map((issue, i) => (
                            <div key={i} className="flex gap-2 text-xs bg-white border border-gray-100 rounded-lg p-2.5 text-gray-700">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>{issue}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-green-700 font-semibold bg-green-50/50 p-3 rounded-lg border border-green-100">
                            No major eligibility blockers identified during this initial assessment.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Visa Suggestion Quiz Results */}
                {selectedLead.tool_name === "Visa Suggestion Quiz" && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Matching Visas Suggestions:</p>
                    <div className="space-y-3">
                      {(selectedLead.results?.suggestions as Array<{ name: string, type: string, desc: string }>)?.map((sug, i) => (
                        <div key={i} className="p-3 bg-white border border-gray-100 rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-brand-primary">{sug.name}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                              {sug.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{sug.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subclass 482 checker results */}
                {(selectedLead.tool_name === "Subclass 482 Eligibility Checker" || selectedLead.tool_name === "Subclass 482 Skills in Demand Visa Eligibility Checker" || selectedLead.results?.quiz_responses) && (
                  <div className="space-y-4">
                    <div className="bg-brand-soft border border-brand-primary/10 p-4 rounded-xl text-center bg-blue-50/50">
                      <p className="text-xs font-bold text-gray-500 uppercase">Calculated Assessment Category</p>
                      <h3 className="text-base font-extrabold text-[#012269] mt-1">
                        {String(selectedLead.results?.calculated_category || 'Further Assessment Required').replace(/_/g, ' ')}
                      </h3>
                    </div>

                    {/* Metadata attributes */}
                    <div className="grid grid-cols-2 gap-3 bg-white border border-gray-100 rounded-xl p-3.5 text-xs text-gray-700">
                      <p><span className="font-bold text-gray-400">Occupation:</span> {String(selectedLead.results?.occupation || 'N/A')}</p>
                      <p><span className="font-bold text-gray-400">Employer Sponsor:</span> {String(selectedLead.results?.employer_name || 'N/A')}</p>
                      <p><span className="font-bold text-gray-400">Passport Country:</span> {String(selectedLead.results?.passport_country || 'N/A')}</p>
                      <p><span className="font-bold text-gray-400">Current Location:</span> {String(selectedLead.results?.current_country || 'N/A')}</p>
                    </div>

                    {/* Flags */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Identified Assessment Flags:</p>
                      <div className="space-y-1.5">
                        {(selectedLead.results?.identified_flags as string[])?.length > 0 ? (
                          (selectedLead.results?.identified_flags as string[]).map((flag, idx) => (
                            <div key={idx} className="flex gap-2 text-xs bg-white border border-gray-100 rounded-lg p-2.5 text-gray-700">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>{flag}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-green-700 font-semibold bg-green-50/50 p-2.5 rounded-lg border border-green-100">
                            No compliance, visa refusal, or sponsorship flags identified.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Raw responses summary */}
                    {selectedLead.results?.quiz_responses && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Detailed Quiz Inputs:</p>
                        <div className="bg-white border border-gray-100 rounded-xl p-3 text-xs space-y-1.5 text-gray-600 font-mono">
                          {Object.entries(selectedLead.results.quiz_responses as Record<string, unknown>).map(([key, val]) => (
                            <div key={key} className="flex justify-between border-b border-gray-50 pb-1 last:border-0 last:pb-0">
                              <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="font-bold text-brand-primary">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end pt-4 border-t mt-4">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-5 py-2.5 text-xs font-extrabold text-white bg-[#012269] hover:bg-[#012269]/90 border rounded-xl transition-all uppercase tracking-wider"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
