"use client"

import React, { useEffect, useState } from "react"
import { format } from "date-fns"
import { Loader2, Search, ExternalLink, Info, X, CheckSquare, Square, Check, Archive, MailCheck, Clock, AlertCircle } from "lucide-react"
import { getWebsiteLeadsAction, updateWebsiteLeadStatusAction, bulkUpdateWebsiteLeadStatusAction } from "@/app/actions/admin"

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

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null)

  // Modal state
  const [selectedLead, setSelectedLead] = useState<WebsiteLead | null>(null)
  const [notesText, setNotesText] = useState("")
  const [leadStatus, setLeadStatus] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const data = await getWebsiteLeadsAction()
        if (isMounted) {
          setLeads((data as WebsiteLead[]) || [])
        }
      } catch (err) {
        console.error("Error fetching website leads:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Open details modal
  const handleOpenDetails = (lead: WebsiteLead) => {
    setSelectedLead(lead)
    setNotesText(lead.notes || "")
    setLeadStatus(lead.status || "new")
  }

  // Save changes for single lead
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return

    try {
      setUpdating(true)
      const res = await updateWebsiteLeadStatusAction(selectedLead.id, leadStatus, notesText)
      if (res.success && res.lead) {
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? (res.lead as unknown as WebsiteLead) : l))
        setSelectedLead(null)
      }
    } catch (err) {
      console.error("Failed to update lead:", err)
      alert(err instanceof Error ? err.message : "Failed to update lead")
    } finally {
      setUpdating(false)
    }
  }

  // Filtered list
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

  // Bulk Selection Handlers
  const allFilteredSelected = filtered.length > 0 && filtered.every(l => selectedIds.has(l.id))

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(l => l.id)))
    }
  }

  const handleSelectFirst20 = () => {
    const first20 = filtered.slice(0, 20).map(l => l.id)
    setSelectedIds(new Set(first20))
  }

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkUpdateStatus = async (targetStatus: string) => {
    const idsArray = Array.from(selectedIds)
    if (idsArray.length === 0) return

    try {
      setBulkUpdating(true)
      setBulkSuccessMsg(null)
      const res = await bulkUpdateWebsiteLeadStatusAction(idsArray, targetStatus)
      if (res.success && res.leads) {
        const updatedMap = new Map((res.leads as WebsiteLead[]).map(l => [l.id, l]))
        setLeads(prev => prev.map(l => updatedMap.get(l.id) || l))
        setBulkSuccessMsg(`Successfully updated ${res.count} lead(s) to "${targetStatus}"!`)
        setSelectedIds(new Set())
        setTimeout(() => setBulkSuccessMsg(null), 4000)
      }
    } catch (err) {
      console.error("Bulk update failed:", err)
      alert(err instanceof Error ? err.message : "Bulk update failed.")
    } finally {
      setBulkUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loader h-[60vh] flex items-center justify-center">
        <Loader2 className="admin-loader-icon animate-spin w-8 h-8 text-slate-400" />
      </div>
    )
  }

  const newCount = leads.filter(l => (l.status || "new") === "new").length
  const contactedCount = leads.filter(l => l.status === "contacted").length
  const inProgressCount = leads.filter(l => l.status === "in_progress").length
  const archivedCount = leads.filter(l => l.status === "archived").length
  const totalCount = leads.length

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "new":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "contacted":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "archived":
        return "bg-slate-100 text-slate-700 border-slate-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  return (
    <div className="admin-page space-y-6">
      {/* Title + Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="admin-heading text-2xl font-bold text-gray-900">
            Website Contact Leads
          </h1>
          <p className="admin-subheading text-gray-500 text-sm">Inquiries submitted via contact forms on migrationrepublic.com.au</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search website leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-input pl-9 w-full py-2 px-3 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="admin-select w-full sm:w-44 py-2 px-3 border border-gray-200 rounded-xl text-sm font-medium"
          >
            <option value="all">All Statuses ({totalCount})</option>
            <option value="new">New ({newCount})</option>
            <option value="contacted">Contacted ({contactedCount})</option>
            <option value="in_progress">In Progress ({inProgressCount})</option>
            <option value="archived">Archived ({archivedCount})</option>
          </select>
        </div>
      </div>

      {/* Corporate KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Leads */}
        <div
          onClick={() => setStatusFilter("all")}
          className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            statusFilter === "all" ? "border-slate-900 ring-1 ring-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500">Total Leads</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>

        {/* New Leads */}
        <div
          onClick={() => setStatusFilter("new")}
          className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            statusFilter === "new" ? "border-amber-700 ring-1 ring-amber-700 bg-amber-50/50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700">New Action</p>
            {newCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{newCount}</p>
        </div>

        {/* Contacted */}
        <div
          onClick={() => setStatusFilter("contacted")}
          className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            statusFilter === "contacted" ? "border-green-700 ring-1 ring-green-700 bg-green-50/50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <p className="text-xs font-semibold text-green-700">Contacted</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{contactedCount}</p>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setStatusFilter("in_progress")}
          className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            statusFilter === "in_progress" ? "border-blue-700 ring-1 ring-blue-700 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <p className="text-xs font-semibold text-blue-700">In Progress</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{inProgressCount}</p>
        </div>

        {/* Archived */}
        <div
          onClick={() => setStatusFilter("archived")}
          className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            statusFilter === "archived" ? "border-slate-700 ring-1 ring-slate-700 bg-slate-100" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <p className="text-xs font-semibold text-slate-700">Archived</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{archivedCount}</p>
        </div>
      </div>

      {/* Bulk Success Notification */}
      {bulkSuccessMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-900 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>{bulkSuccessMsg}</span>
          </div>
          <button onClick={() => setBulkSuccessMsg(null)} className="text-green-700 hover:text-green-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk Action Bar (When 1 or more items are selected) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleToggleSelectAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {allFilteredSelected ? <CheckSquare className="w-4 h-4 text-brand-primary" /> : <Square className="w-4 h-4 text-slate-400" />}
            <span>{allFilteredSelected ? "Deselect All" : "Select All Visible"}</span>
          </button>

          <button
            onClick={handleSelectFirst20}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Select First 20
          </button>

          {selectedIds.size > 0 && (
            <span className="text-xs font-bold text-brand-primary bg-brand-soft px-3 py-1.5 rounded-lg border border-brand-primary/10">
              {selectedIds.size} Lead(s) Selected
            </span>
          )}
        </div>

        {/* 1-Click Status Update Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">1-Click Update:</span>

          <button
            disabled={selectedIds.size === 0 || bulkUpdating}
            onClick={() => handleBulkUpdateStatus("archived")}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1"
          >
            {bulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
            Archive {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </button>

          <button
            disabled={selectedIds.size === 0 || bulkUpdating}
            onClick={() => handleBulkUpdateStatus("contacted")}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 shadow-xs"
          >
            {bulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MailCheck className="w-3.5 h-3.5" />}
            Contacted {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </button>

          <button
            disabled={selectedIds.size === 0 || bulkUpdating}
            onClick={() => handleBulkUpdateStatus("in_progress")}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 shadow-xs"
          >
            {bulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
            In Progress {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </button>

          <button
            disabled={selectedIds.size === 0 || bulkUpdating}
            onClick={() => handleBulkUpdateStatus("new")}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 shadow-xs"
          >
            {bulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
            New {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-card bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Sender</th>
                <th className="py-3.5 px-4">Subject &amp; Message</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {error ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-red-600 text-sm">
                    Error loading leads: {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500 text-sm">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(lead => {
                  const isChecked = selectedIds.has(lead.id)
                  return (
                    <tr
                      key={lead.id}
                      className={`transition-colors ${
                        isChecked ? "bg-blue-50/40" : "hover:bg-gray-50/60"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(lead.id)}
                          className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">
                          {lead.first_name || lead.last_name ? `${lead.first_name || ""} ${lead.last_name || ""}` : "Anonymous"}
                        </span>
                        <span className="text-xs text-gray-500 block">{lead.email}</span>
                        {lead.phone && <span className="text-xs text-gray-400 block">{lead.phone}</span>}
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <span className="font-semibold text-gray-900 block truncate max-w-xs">{lead.subject || "No Subject"}</span>
                        <span className="text-xs text-gray-500 block truncate max-w-xs" title={lead.message || ""}>
                          {lead.message || "No message body"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getStatusBadgeClass(lead.status || "new")}`}>
                          {lead.status || "new"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {format(new Date(lead.created_at), "MMM d, yyyy h:mm a")}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(lead)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#012269] hover:underline"
                        >
                          Details <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
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
                <span className="text-[10px] font-black uppercase tracking-widest text-[#012269]">
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
