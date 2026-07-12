"use client"

import React, { useEffect, useState } from "react"
import { format } from "date-fns"
import { Loader2, Search, Users, ExternalLink, Wrench } from "lucide-react"
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
                      <button className="admin-cell-primary flex items-center gap-1 text-xs ml-auto hover:underline" style={{ color: 'var(--color-admin-navy)' }}>
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
  )
}
