"use client"

import React, { useEffect, useState } from "react"
import { format } from "date-fns"
import { Loader2, Search, Users, ExternalLink, Globe, Calendar, Info, X } from "lucide-react"
import { getWebsiteLeadsAction, updateWebsiteLeadStatusAction } from "@/app/actions/admin"

interface WebsiteLead {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  subject: string | null
  message: string | null
  source_url: string | null
  wordpress_form_id: string | null
  wordpress_lead_id: string | null
  status: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export default function WebsiteLeadsPage() {
  const [leads, setLeads] = useState<WebsiteLead[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [selectedLead, setSelectedLead] = useState<WebsiteLead | null>(null)
  const [notesText, setNotesText] = useState("")
  const [leadStatus, setLeadStatus] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    try {
      setLoading(true)
      setError(null)
      const data = await getWebsiteLeadsAction()
      setLeads((data as WebsiteLead[]) || [])
    } catch (err) {
      console.error("Error fetching website leads:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // Open details modal
  const handleOpenDetails = (lead: WebsiteLead) => {
    setSelectedLead(lead)
    setNotesText(lead.notes || "")
    setLeadStatus(lead.status || "new")
  }

  // Save changes
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return

    try {
      setUpdating(true)
      const res = await updateWebsiteLeadStatusAction(selectedLead.id, leadStatus, notesText)
      if (res.success && res.lead) {
        // Update local list
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? (res.lead as unknown as WebsiteLead) : l))
        setSelectedLead(res.lead as unknown as WebsiteLead)
        // Close modal or show success
        setSelectedLead(null)
      }
    } catch (err) {
      console.error("Failed to update lead:", err)
      alert(err instanceof Error ? err.message : "Failed to update lead")
    } finally {
      setUpdating(false)
    }
  }

  const filtered = leads.filter(l => {
    const fullName = `${l.first_name || ""} ${l.last_name || ""}`.toLowerCase()
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.subject?.toLowerCase().includes(search.toLowerCase()) ||
      l.message?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || (l.status || "new") === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="admin-loader h-[60vh]">
        <Loader2 className="admin-loader-icon animate-spin" />
      </div>
    )
  }

  const newCount = leads.filter(l => (l.status || "new") === "new").length
  const contactedCount = leads.filter(l => l.status === "contacted").length
  const totalCount = leads.length

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "new":
        return "admin-badge-warn"
      case "contacted":
        return "admin-badge-success"
      case "in_progress":
        return "admin-badge-info"
      case "archived":
        return "admin-badge-navy"
      default:
        return "admin-badge-navy"
    }
  }

  return (
    <div className="admin-page">
      {/* Title + Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="admin-heading flex items-center gap-2">
            <Globe className="w-7 h-7" style={{ color: 'var(--color-admin-gold)' }} />
            Website Contact Leads
          </h1>
          <p className="admin-subheading">Leads submitted via contact forms on migrationrepublic.com.au</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-admin-muted)' }} />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-input pl-9 w-full"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="admin-select w-full sm:w-44"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="in_progress">In Progress</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Leads', value: totalCount, icon: Users, accent: 'text-[#012269] bg-[#012269]/8 border border-[#012269]/15' },
          { label: 'New Leads', value: newCount, icon: Calendar, accent: 'text-amber-700 bg-amber-50 border border-amber-200' },
          { label: 'Contacted Leads', value: contactedCount, icon: Globe, accent: 'text-green-700 bg-green-50 border border-green-200' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="admin-card p-6 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="admin-label">{s.label}</p>
                <p className="admin-value mt-2">{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${s.accent}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="admin-thead">
              <tr>
                <th>Sender</th>
                <th>Subject &amp; Message</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-tbody">
              {error ? (
                <tr>
                  <td colSpan={5} className="admin-td text-center py-6" style={{ color: 'var(--color-badge-error-text)' }}>
                    Error loading leads: {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-td text-center py-10" style={{ color: 'var(--color-admin-muted)' }}>
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(lead => (
                  <tr key={lead.id} className="admin-tr">
                    <td className="admin-td">
                      <span className="admin-cell-primary block">
                        {lead.first_name || lead.last_name ? `${lead.first_name || ""} ${lead.last_name || ""}` : "Anonymous"}
                      </span>
                      <span className="admin-cell-muted block">{lead.email}</span>
                      {lead.phone && <span className="admin-cell-muted block text-xs">{lead.phone}</span>}
                    </td>
                    <td className="admin-td max-w-md">
                      <span className="admin-cell-primary block font-semibold truncate max-w-xs">{lead.subject || "No Subject"}</span>
                      <span className="admin-cell-muted block truncate max-w-xs" title={lead.message || ""}>
                        {lead.message || "No message body"}
                      </span>
                    </td>
                    <td className="admin-td">
                      <span className={`admin-badge capitalize ${getStatusBadgeClass(lead.status || "new")}`}>
                        {lead.status || "new"}
                      </span>
                    </td>
                    <td className="admin-td admin-cell-muted">
                      {format(new Date(lead.created_at), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="admin-td text-right">
                      <button
                        onClick={() => handleOpenDetails(lead)}
                        className="admin-cell-primary flex items-center gap-1.5 text-xs ml-auto hover:underline font-bold"
                        style={{ color: 'var(--color-admin-navy)' }}
                      >
                        Details <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Action Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white border rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-admin-gold)' }}>
                  Lead Submission Details
                </span>
                <h3 className="text-xl font-extrabold text-gray-800 mt-1">
                  {selectedLead.first_name || selectedLead.last_name
                    ? `${selectedLead.first_name || ""} ${selectedLead.last_name || ""}`
                    : "Anonymous Contact"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <form onSubmit={handleSaveChanges} className="space-y-4 overflow-y-auto flex-1 pr-1 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact details */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Information</h4>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p><span className="font-semibold">Email: </span><a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline">{selectedLead.email}</a></p>
                    <p><span className="font-semibold">Phone: </span>{selectedLead.phone || "—"}</p>
                    <p>
                      <span className="font-semibold">Source URL: </span>
                      {selectedLead.source_url ? (
                        <a href={selectedLead.source_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5 inline-flex">
                          View Page <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : "—"}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Technical Meta</h4>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p><span className="font-semibold">WordPress Form ID: </span><code>{selectedLead.wordpress_form_id || "—"}</code></p>
                    <p><span className="font-semibold">WordPress Lead ID: </span><code>{selectedLead.wordpress_lead_id || "—"}</code></p>
                    <p><span className="font-semibold">Submitted At: </span>{format(new Date(selectedLead.created_at), "MMM d, yyyy h:mm a")}</p>
                  </div>
                </div>
              </div>

              {/* Message block */}
              <div className="p-4 rounded-2xl border border-gray-100 space-y-2 bg-gray-50">
                <div className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Message Content</span>
                </div>
                <div className="text-sm font-semibold text-gray-800 border-b pb-1.5">{selectedLead.subject || "No Subject"}</div>
                <div className="text-sm text-gray-600 whitespace-pre-wrap pt-1.5 leading-relaxed bg-white border rounded-xl p-3 max-h-40 overflow-y-auto">
                  {selectedLead.message || "No message body"}
                </div>
              </div>

              {/* Actions panel */}
              <div className="p-4 rounded-2xl border border-gray-100 space-y-3.5 bg-gray-50">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lead Management Actions</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <label className="text-xs font-bold text-gray-700">Change Pipeline Status:</label>
                  <select
                    value={leadStatus}
                    onChange={e => setLeadStatus(e.target.value)}
                    className="admin-select py-1.5 text-xs col-span-2 bg-white"
                  >
                    <option value="new">New (Needs Action)</option>
                    <option value="contacted">Contacted / Replied</option>
                    <option value="in_progress">In Progress</option>
                    <option value="archived">Archived / Junk</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Internal Admin Notes:</label>
                  <textarea
                    rows={3}
                    value={notesText}
                    onChange={e => setNotesText(e.target.value)}
                    placeholder="Add follow-up notes, phone call logs, or visa interest notes..."
                    className="admin-input text-xs resize-none bg-white"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 justify-end pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 border rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 bg-[#012269] hover:bg-[#012269]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}
