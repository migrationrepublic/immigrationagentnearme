"use client"

import React, { useEffect, useState } from "react"
import { format } from "date-fns"
import { Loader2, Search, Users, ExternalLink, Wrench, X, Info, AlertTriangle, CheckCircle2, List, Building2, Receipt, Sparkles } from "lucide-react"
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

interface ToolLeadResults {
  totalPoints?: number
  breakdown?: Array<{ category: string; selection: string; points: number }>
  status?: string
  issues?: string[]
  suggestions?: Array<{ name: string; type: string; desc: string }>
  calculated_category?: string
  passport_country?: string
  current_country?: string
  occupation?: string
  employer_name?: string
  consent_given?: string
  identified_flags?: string[]
  quiz_responses?: Record<string, unknown>

  // Employer Tools Fields
  business_name?: string
  sponsor_status?: string
  lawfully_trading?: string
  financial_capacity?: string
  industry?: string
  offered_salary?: string
  salary_meets_csit?: string
  labour_market_testing?: string
  location?: string
  compliance_issues?: string
  calculated_tier?: string
  headline?: string
  summary?: string
  identified_action_items?: Array<{ type: string; title: string; detail: string; action: string }>

  // Sponsorship Cost Estimator Fields
  visa_subclass?: string
  business_turnover?: string
  number_of_workers?: number
  years_of_stay?: string
  accompanying_family?: string
  nomination_fees_total?: string
  saf_levy_total?: string
  primary_vac_total?: string
  family_vac_total?: string
  grand_total_government_charges?: string
  itemised_breakdown?: Record<string, string>
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

  const [toolFilter, setToolFilter] = useState("all")

  const filtered = leads.filter(l => {
    const matchesSearch =
      l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.tool_name?.toLowerCase().includes(search.toLowerCase()) ||
      (l.results && JSON.stringify(l.results).toLowerCase().includes(search.toLowerCase()))

    let matchesTool = true
    if (toolFilter === "sponsor") {
      matchesTool = l.tool_name?.includes("Business Sponsor")
    } else if (toolFilter === "cost") {
      matchesTool = l.tool_name?.includes("Cost Estimator") || l.tool_name?.includes("Sponsorship Cost")
    } else if (toolFilter === "482") {
      matchesTool = l.tool_name?.includes("482") && !l.tool_name?.includes("Business Sponsor")
    } else if (toolFilter === "pr") {
      matchesTool = l.tool_name === "PR Calculator" || l.tool_name === "PR Points Calculator"
    } else if (toolFilter === "eligibility") {
      matchesTool = l.tool_name === "Eligibility Checker"
    } else if (toolFilter === "quiz") {
      matchesTool = l.tool_name === "Visa Suggestion Quiz" || (!l.tool_name?.includes("482") && l.tool_name !== "PR Calculator" && l.tool_name !== "PR Points Calculator" && l.tool_name !== "Eligibility Checker" && !l.tool_name?.includes("Business Sponsor") && !l.tool_name?.includes("Cost"))
    }

    return matchesSearch && matchesTool
  })

  if (loading) {
    return (
      <div className="admin-loader h-[60vh] flex items-center justify-center">
        <Loader2 className="admin-loader-icon animate-spin w-8 h-8 text-purple-700" />
      </div>
    )
  }

  const sponsorCount     = leads.filter(l => l.tool_name?.includes("Business Sponsor")).length
  const costCount        = leads.filter(l => l.tool_name?.includes("Cost Estimator") || l.tool_name?.includes("Sponsorship Cost")).length
  const count482         = leads.filter(l => l.tool_name?.includes("482") && !l.tool_name?.includes("Business Sponsor")).length
  const prCount          = leads.filter(l => l.tool_name === "PR Calculator" || l.tool_name === "PR Points Calculator").length
  const eligibilityCount = leads.filter(l => l.tool_name === "Eligibility Checker").length
  const quizCount        = leads.filter(l => l.tool_name === "Visa Suggestion Quiz" || (!l.tool_name?.includes("482") && l.tool_name !== "PR Calculator" && l.tool_name !== "PR Points Calculator" && l.tool_name !== "Eligibility Checker" && !l.tool_name?.includes("Business Sponsor") && !l.tool_name?.includes("Cost"))).length
  const totalCount       = leads.length

  return (
    <div className="admin-page space-y-6">
      {/* Title + search & tool filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="admin-heading flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Wrench className="w-7 h-7 text-purple-700" />
            Tool Submissions &amp; Lead KPIs
          </h1>
          <p className="admin-subheading text-gray-500 text-sm">Corporate sponsorship diagnostics, cost estimates, PR points, and visa quizzes</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search user, email, business..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-input pl-9 w-full py-2 px-3 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          {/* Tool Filter */}
          <select
            value={toolFilter}
            onChange={e => setToolFilter(e.target.value)}
            className="admin-select w-full sm:w-60 py-2 px-3 border border-gray-200 rounded-xl text-sm font-medium"
          >
            <option value="all">All Tools ({totalCount})</option>
            <option value="sponsor">Business Sponsor Quick ({sponsorCount})</option>
            <option value="cost">Sponsorship Cost Estimator ({costCount})</option>
            <option value="482">Subclass 482 Checker ({count482})</option>
            <option value="pr">PR Calculator ({prCount})</option>
            <option value="eligibility">Eligibility Checker ({eligibilityCount})</option>
            <option value="quiz">Visa Quiz ({quizCount})</option>
          </select>
        </div>
      </div>

      {/* Corporate Tool KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* All Tools */}
        <div
          onClick={() => setToolFilter("all")}
          className={`p-3.5 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            toolFilter === "all" ? "border-slate-900 ring-1 ring-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-semibold">All Leads</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
        </div>

        {/* Business Sponsor Quick */}
        <div
          onClick={() => setToolFilter("sponsor")}
          className={`p-3.5 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            toolFilter === "sponsor" ? "border-blue-700 ring-1 ring-blue-700 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex justify-between items-center text-blue-700 mb-1">
            <span className="text-xs font-semibold">Sponsor Quick</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{sponsorCount}</div>
        </div>

        {/* Cost Estimator */}
        <div
          onClick={() => setToolFilter("cost")}
          className={`p-3.5 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            toolFilter === "cost" ? "border-emerald-700 ring-1 ring-emerald-700 bg-emerald-50/50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex justify-between items-center text-emerald-700 mb-1">
            <span className="text-xs font-semibold">Cost Estimator</span>
            <Receipt className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{costCount}</div>
        </div>

        {/* 482 Checker */}
        <div
          onClick={() => setToolFilter("482")}
          className={`p-3.5 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            toolFilter === "482" ? "border-amber-700 ring-1 ring-amber-700 bg-amber-50/50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex justify-between items-center text-amber-700 mb-1">
            <span className="text-xs font-semibold">482 Visa</span>
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{count482}</div>
        </div>

        {/* PR Calc */}
        <div
          onClick={() => setToolFilter("pr")}
          className={`p-3.5 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            toolFilter === "pr" ? "border-indigo-700 ring-1 ring-indigo-700 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex justify-between items-center text-indigo-700 mb-1">
            <span className="text-xs font-semibold">PR Calc</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{prCount}</div>
        </div>

        {/* Eligibility */}
        <div
          onClick={() => setToolFilter("eligibility")}
          className={`p-3.5 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            toolFilter === "eligibility" ? "border-green-700 ring-1 ring-green-700 bg-green-50/50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex justify-between items-center text-green-700 mb-1">
            <span className="text-xs font-semibold">Eligibility</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{eligibilityCount}</div>
        </div>

        {/* Visa Quiz */}
        <div
          onClick={() => setToolFilter("quiz")}
          className={`p-3.5 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
            toolFilter === "quiz" ? "border-purple-700 ring-1 ring-purple-700 bg-purple-50/50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex justify-between items-center text-purple-700 mb-1">
            <span className="text-xs font-semibold">Visa Quiz</span>
            <List className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{quizCount}</div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User / Employer</th>
                <th className="py-3.5 px-4">Tool Used</th>
                <th className="py-3.5 px-4">Outcome / Highlights</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500 text-sm">
                    No submissions found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(lead => {
                  const r = (lead.results as unknown as ToolLeadResults) || {}
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{lead.user_name}</div>
                        {r.business_name && (
                          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" /> {r.business_name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">{lead.user_email}</div>
                        {lead.user_phone && (
                          <div className="text-xs text-gray-400">{lead.user_phone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {lead.tool_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {/* Highlights based on tool */}
                        {lead.tool_name?.includes("Business Sponsor") && (
                          <div className="space-y-0.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              r.calculated_tier?.includes('Strong') ? 'bg-green-100 text-green-800' :
                              r.calculated_tier?.includes('Possible') ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {r.calculated_tier || 'Assessment Completed'}
                            </span>
                            <div className="text-xs text-gray-500">
                              Salary: {r.offered_salary || 'N/A'} • {r.sponsor_status || 'SBS'}
                            </div>
                          </div>
                        )}

                        {(lead.tool_name?.includes("Cost Estimator") || lead.tool_name?.includes("Sponsorship Cost")) && (
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                              {r.grand_total_government_charges || 'Total Calculated'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {r.visa_subclass} • {r.number_of_workers} worker(s)
                            </div>
                          </div>
                        )}

                        {lead.tool_name?.includes("482") && !lead.tool_name?.includes("Business Sponsor") && (
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                              {r.calculated_category || 'Assessed'}
                            </span>
                            <div className="text-xs text-gray-500">
                              {r.occupation || 'CSOL Check'}
                            </div>
                          </div>
                        )}

                        {(lead.tool_name === "PR Calculator" || lead.tool_name === "PR Points Calculator") && (
                          <div className="text-xs font-bold text-indigo-700">
                            {r.totalPoints} Estimated Points
                          </div>
                        )}

                        {lead.tool_name === "Eligibility Checker" && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            r.status === 'eligible' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.status === 'eligible' ? 'Likely Eligible' : 'Issues Identified'}
                          </span>
                        )}

                        {lead.tool_name === "Visa Suggestion Quiz" && (
                          <div className="text-xs text-purple-700 font-medium">
                            {r.suggestions?.length || 0} Visas Recommended
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(lead.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          View Details
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

      {/* DETAIL SLIDE-OUT / MODAL DRAWER */}
      {selectedLead && (() => {
        const lead = selectedLead
        const results = (lead.results as unknown as ToolLeadResults) || {}
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-white border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#E40229]">
                    Interactive Tool Submission Details
                  </span>
                  <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                    {lead.user_name}
                  </h3>
                  {results.business_name && (
                    <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" /> {results.business_name}
                    </div>
                  )}
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
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Information</h4>
                    <div className="text-xs space-y-1">
                      <p><span className="font-semibold text-gray-500">Email: </span><a href={`mailto:${lead.user_email}`} className="text-blue-600 hover:underline">{lead.user_email}</a></p>
                      <p><span className="font-semibold text-gray-500">Phone: </span>{lead.user_phone || "—"}</p>
                      {results.business_name && (
                        <p><span className="font-semibold text-gray-500">Business: </span>{results.business_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Submission Meta</h4>
                    <div className="text-xs space-y-1">
                      <p><span className="font-semibold text-gray-500">Tool Used: </span><span className="font-bold text-brand-primary">{lead.tool_name}</span></p>
                      <p><span className="font-semibold text-gray-500">Submitted: </span>{format(new Date(lead.created_at), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  </div>
                </div>

                {/* Assessment details */}
                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50 space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 border-b pb-2">
                    <Info className="w-4 h-4 text-brand-primary" /> Assessment &amp; Calculation Results
                  </h4>

                  {/* 1. CAN MY BUSINESS SPONSOR? RESULTS */}
                  {lead.tool_name?.includes("Business Sponsor") && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl text-center bg-blue-50 border border-blue-100">
                        <p className="text-xs font-bold text-gray-500 uppercase">Assessment Verdict Tier</p>
                        <h3 className="text-lg font-black text-brand-primary mt-1">
                          {results.calculated_tier || results.headline}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">{results.summary}</p>
                      </div>

                      {/* Diagnostic Inputs Grid */}
                      <div className="grid grid-cols-2 gap-3 bg-white border border-gray-100 rounded-xl p-3.5 text-xs text-gray-700">
                        <p><span className="font-bold text-gray-400">Sponsor Status:</span> {results.sponsor_status}</p>
                        <p><span className="font-bold text-gray-400">Trading Status:</span> {results.lawfully_trading}</p>
                        <p><span className="font-bold text-gray-400">Offered Salary:</span> {results.offered_salary}</p>
                        <p><span className="font-bold text-gray-400">Meets CSIT:</span> {results.salary_meets_csit}</p>
                        <p><span className="font-bold text-gray-400">Industry:</span> {results.industry}</p>
                        <p><span className="font-bold text-gray-400">Location:</span> {results.location}</p>
                        <p><span className="font-bold text-gray-400">LMT (Ads):</span> {results.labour_market_testing}</p>
                        <p><span className="font-bold text-gray-400">Compliance History:</span> {results.compliance_issues}</p>
                      </div>

                      {/* Action Items List */}
                      {results.identified_action_items && results.identified_action_items.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Identified Flags &amp; Action Items:</p>
                          <div className="space-y-2">
                            {results.identified_action_items.map((item, idx) => (
                              <div key={idx} className="p-3 bg-white border border-gray-100 rounded-xl text-xs space-y-1">
                                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  {item.title}
                                </div>
                                <p className="text-gray-600">{item.detail}</p>
                                <p className="text-brand-accent font-semibold pt-1">Fix: {item.action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. SPONSORSHIP COST ESTIMATOR RESULTS */}
                  {(lead.tool_name?.includes("Cost Estimator") || lead.tool_name?.includes("Sponsorship Cost")) && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl text-center bg-emerald-50 border border-emerald-100">
                        <p className="text-xs font-bold text-gray-500 uppercase">Estimated Government Statutory Charges</p>
                        <h3 className="text-3xl font-black text-emerald-800 mt-1">
                          {results.grand_total_government_charges}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">{results.visa_subclass} • {results.number_of_workers} Worker(s)</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-white border border-gray-100 rounded-xl p-3.5 text-xs text-gray-700">
                        <p><span className="font-bold text-gray-400">Business Turnover:</span> {results.business_turnover}</p>
                        <p><span className="font-bold text-gray-400">Years of Stay:</span> {results.years_of_stay}</p>
                        <p><span className="font-bold text-gray-400">Nomination Total:</span> {results.nomination_fees_total}</p>
                        <p><span className="font-bold text-gray-400">SAF Levy Total:</span> {results.saf_levy_total}</p>
                        <p><span className="font-bold text-gray-400">Primary VAC Total:</span> {results.primary_vac_total}</p>
                        <p><span className="font-bold text-gray-400">Family VAC Total:</span> {results.family_vac_total}</p>
                        <p className="col-span-2"><span className="font-bold text-gray-400">Family Dependants:</span> {results.accompanying_family}</p>
                      </div>
                    </div>
                  )}

                  {/* 3. PR Points Calculator Results */}
                  {(lead.tool_name === "PR Calculator" || lead.tool_name === "PR Points Calculator") && (
                    <div className="space-y-4">
                      <div className="bg-brand-soft border border-brand-primary/10 p-4 rounded-xl text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase">Calculated PR Score</p>
                        <h3 className="text-3xl font-black text-brand-accent mt-1">
                          {Number(results.totalPoints || 0)} Points
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
                            {(results.breakdown as Array<{ category: string, selection: string, points: number }>)?.map((item, i) => (
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

                  {/* 4. Eligibility Checker Results */}
                  {lead.tool_name === "Eligibility Checker" && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl text-center border font-bold text-sm ${
                        results.status === "eligible" ? "bg-green-50 border-green-100 text-green-800"
                        : results.status === "warning" ? "bg-amber-50 border-amber-100 text-amber-800"
                        : "bg-red-50 border-red-100 text-red-800"
                      }`}>
                        {results.status === "eligible" ? "Likely Eligible for Skilled Visas"
                         : results.status === "warning" ? "Needs Review / Potential Issues"
                         : "High Risk / Likely Not Eligible"}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Key Assessment Notes:</p>
                        <div className="space-y-2">
                          {(results.issues as string[])?.length > 0 ? (
                            (results.issues as string[]).map((issue, i) => (
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

                  {/* 5. Visa Suggestion Quiz Results */}
                  {lead.tool_name === "Visa Suggestion Quiz" && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Matching Visas Suggestions:</p>
                      <div className="space-y-3">
                        {(results.suggestions as Array<{ name: string, type: string, desc: string }>)?.map((sug, i) => (
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

                  {/* 6. Subclass 482 checker results */}
                  {(lead.tool_name === "Subclass 482 Eligibility Checker" || lead.tool_name === "Subclass 482 Skills in Demand Visa Eligibility Checker" || (results.quiz_responses && !lead.tool_name?.includes("Business Sponsor"))) && (
                    <div className="space-y-4">
                      <div className="bg-brand-soft border border-brand-primary/10 p-4 rounded-xl text-center bg-blue-50/50">
                        <p className="text-xs font-bold text-gray-500 uppercase">Calculated Assessment Category</p>
                        <h3 className="text-base font-extrabold text-[#012269] mt-1">
                          {String(results.calculated_category || 'Further Assessment Required').replace(/_/g, ' ')}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-white border border-gray-100 rounded-xl p-3.5 text-xs text-gray-700">
                        <p><span className="font-bold text-gray-400">Occupation:</span> {String(results.occupation || 'N/A')}</p>
                        <p><span className="font-bold text-gray-400">Employer Sponsor:</span> {String(results.employer_name || 'N/A')}</p>
                        <p><span className="font-bold text-gray-400">Passport Country:</span> {String(results.passport_country || 'N/A')}</p>
                        <p><span className="font-bold text-gray-400">Current Location:</span> {String(results.current_country || 'N/A')}</p>
                      </div>

                      {results.identified_flags && results.identified_flags.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Identified Assessment Flags:</p>
                          <div className="space-y-1.5">
                            {results.identified_flags.map((flag, idx) => (
                              <div key={idx} className="flex gap-2 text-xs bg-white border border-gray-100 rounded-lg p-2.5 text-gray-700">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                <span>{flag}</span>
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
        )
      })()}
    </div>
  )
}
