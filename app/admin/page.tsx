'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Calendar,
  FileText,
  Signature,
  Wrench,
  Globe,
  DollarSign,
  Activity,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface DetailedWebsiteLead {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  subject: string | null
  message: string | null
  status: string | null
  created_at: string
}

interface DetailedToolLead {
  id: string
  user_name: string
  user_email: string
  user_phone?: string
  tool_name: string
  results?: Record<string, unknown>
  created_at: string
}

interface DashboardStats {
  todayBookings: number
  pendingDocs: number
  pendingSignatures: number
  websiteLeadsTotal: number
  websiteLeadsNew: number
  websiteLeadsContacted: number
  websiteLeadsInProgress: number
  websiteLeadsArchived: number
  toolLeadsTotal: number
  toolLeadsPRCount: number
  toolLeads482Count: number
  toolLeadsEligibilityCount: number
  toolLeadsQuizCount: number
  revenue: number
}

interface AuditLog {
  id: string
  action: string
  entity_type: string
  created_at: string
  details: Record<string, unknown>
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    pendingDocs: 0,
    pendingSignatures: 0,
    websiteLeadsTotal: 0,
    websiteLeadsNew: 0,
    websiteLeadsContacted: 0,
    websiteLeadsInProgress: 0,
    websiteLeadsArchived: 0,
    toolLeadsTotal: 0,
    toolLeadsPRCount: 0,
    toolLeads482Count: 0,
    toolLeadsEligibilityCount: 0,
    toolLeadsQuizCount: 0,
    revenue: 0,
  })
  const [recentWebsiteLeads, setRecentWebsiteLeads] = useState<DetailedWebsiteLead[]>([])
  const [recentToolLeads, setRecentToolLeads] = useState<DetailedToolLead[]>([])
  const [activity, setActivity] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'website' | 'tool' | 'audit'>('website')
  const [refreshing, setRefreshing] = useState(false)

  async function loadStats() {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')

      const [
        { count: todayBookings },
        { count: pendingDocs },
        { count: pendingSignatures },
        { data: websiteLeadsData },
        { data: toolLeadsData },
        { data: bookingsData },
        { data: logsData }
      ] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('date', todayStr),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('signature_requests').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('website_leads').select('*').order('created_at', { ascending: false }),
        supabase.from('tool_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('plans(price_aud)').eq('status', 'confirmed'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
      ])

      let totalRev = 0
      const typedBookings = bookingsData as unknown as Array<{ plans: { price_aud: number } | null }> | null
      typedBookings?.forEach(b => { if (b.plans?.price_aud) totalRev += b.plans.price_aud })

      const wLeads = (websiteLeadsData as DetailedWebsiteLead[]) || []
      const wTotal = wLeads.length
      const wNew = wLeads.filter(l => (l.status || 'new') === 'new').length
      const wContacted = wLeads.filter(l => l.status === 'contacted').length
      const wInProgress = wLeads.filter(l => l.status === 'in_progress').length
      const wArchived = wLeads.filter(l => l.status === 'archived').length

      const tLeads = (toolLeadsData as DetailedToolLead[]) || []
      const tTotal = tLeads.length
      const tPR = tLeads.filter(l => l.tool_name === 'PR Calculator' || l.tool_name === 'PR Points Calculator').length
      const t482 = tLeads.filter(l => l.tool_name?.includes('482')).length
      const tEligibility = tLeads.filter(l => l.tool_name === 'Eligibility Checker').length
      const tQuiz = tLeads.filter(l => l.tool_name === 'Visa Suggestion Quiz' || (!l.tool_name?.includes('482') && l.tool_name !== 'PR Calculator' && l.tool_name !== 'PR Points Calculator' && l.tool_name !== 'Eligibility Checker')).length

      setStats({
        todayBookings: todayBookings || 0,
        pendingDocs: pendingDocs || 0,
        pendingSignatures: pendingSignatures || 0,
        websiteLeadsTotal: wTotal,
        websiteLeadsNew: wNew,
        websiteLeadsContacted: wContacted,
        websiteLeadsInProgress: wInProgress,
        websiteLeadsArchived: wArchived,
        toolLeadsTotal: tTotal,
        toolLeadsPRCount: tPR,
        toolLeads482Count: t482,
        toolLeadsEligibilityCount: tEligibility,
        toolLeadsQuizCount: tQuiz,
        revenue: totalRev / 100,
      })

      setRecentWebsiteLeads(wLeads.slice(0, 7))
      setRecentToolLeads(tLeads.slice(0, 7))
      setActivity((logsData as AuditLog[]) || [])
    } catch (e) {
      console.error('Error fetching dashboard stats:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadStats()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Key performance metrics and lead activity across your portal.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {/* Top 6 Standard Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Bookings */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Today's Bookings</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.todayBookings}</p>
        </div>

        {/* Website Leads */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Website Leads</p>
            {stats.websiteLeadsNew > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {stats.websiteLeadsNew} new
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.websiteLeadsTotal}</p>
        </div>

        {/* Tool Leads */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Tool Submissions</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.toolLeadsTotal}</p>
        </div>

        {/* Pending Docs */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Pending Review</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.pendingDocs}</p>
        </div>

        {/* Pending Signatures */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Signatures Sent</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.pendingSignatures}</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">${stats.revenue.toLocaleString('en-AU')}</p>
        </div>
      </div>

      {/* Two Clean Main KPI Breakdown Cards: Website Leads vs Tool Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Website Leads Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Website Contact Inquiries</h2>
                <p className="text-xs text-slate-500">Forms submitted on migrationrepublic.com.au</p>
              </div>
            </div>
            <Link
              href="/admin/website-leads"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">New</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{stats.websiteLeadsNew}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">Contacted</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{stats.websiteLeadsContacted}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">In Progress</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{stats.websiteLeadsInProgress}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">Archived</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{stats.websiteLeadsArchived}</span>
            </div>
          </div>
        </div>

        {/* 2. Tool Submissions Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Interactive Tool Submissions</h2>
                <p className="text-xs text-slate-500">Points calculators, 482 visa checkers &amp; quizzes</p>
              </div>
            </div>
            <Link
              href="/admin/tool-leads"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">PR Calc</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{stats.toolLeadsPRCount}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">482 Checker</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{stats.toolLeads482Count}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">Eligibility</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{stats.toolLeadsEligibilityCount}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-xs text-slate-500 font-medium block">Visa Quiz</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{stats.toolLeadsQuizCount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Tabbed Activity Feed Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('website')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'website' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Website Leads ({recentWebsiteLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('tool')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'tool' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tool Submissions ({recentToolLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Logs ({activity.length})
            </button>
          </div>

          <Link
            href={activeTab === 'website' ? '/admin/website-leads' : activeTab === 'tool' ? '/admin/tool-leads' : '/admin'}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            View full log &rarr;
          </Link>
        </div>

        {/* Tab Content */}
        {activeTab === 'website' && (
          <div className="overflow-x-auto">
            {recentWebsiteLeads.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-10">No recent website leads found.</p>
            ) : (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Lead Contact</th>
                    <th className="px-6 py-3">Subject / Message</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Submitted</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentWebsiteLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-900">
                          {lead.first_name || lead.last_name ? `${lead.first_name || ''} ${lead.last_name || ''}` : 'Anonymous Contact'}
                        </p>
                        <p className="text-slate-500">{lead.email}</p>
                      </td>
                      <td className="px-6 py-3.5 max-w-xs truncate">
                        <p className="font-medium text-slate-900 truncate">{lead.subject || 'No Subject'}</p>
                        <p className="text-slate-400 truncate">{lead.message || '—'}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                          {(lead.status || 'new').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {format(new Date(lead.created_at), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link href="/admin/website-leads" className="text-slate-900 hover:underline font-semibold">
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'tool' && (
          <div className="overflow-x-auto">
            {recentToolLeads.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-10">No recent tool submissions found.</p>
            ) : (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">User Contact</th>
                    <th className="px-6 py-3">Tool Name</th>
                    <th className="px-6 py-3">Result / Score</th>
                    <th className="px-6 py-3">Submitted</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentToolLeads.map((lead) => {
                    const isPR = lead.tool_name === 'PR Calculator' || lead.tool_name === 'PR Points Calculator'
                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-900">{lead.user_name}</p>
                          <p className="text-slate-500">{lead.user_email}</p>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">{lead.tool_name}</td>
                        <td className="px-6 py-3.5">
                          {isPR ? (
                            <span className="font-semibold text-slate-900">
                              {(lead.results?.totalPoints as number) ?? 0} Points
                            </span>
                          ) : (
                            <span className="text-slate-600">Assessed</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {format(new Date(lead.created_at), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Link href="/admin/tool-leads" className="text-slate-900 hover:underline font-semibold">
                            View details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="overflow-x-auto">
            {activity.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-10">No recent audit activity.</p>
            ) : (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Entity Type</th>
                    <th className="px-6 py-3">Details</th>
                    <th className="px-6 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activity.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900">{log.entity_type}</td>
                      <td className="px-6 py-3.5 max-w-[280px] truncate text-slate-500">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {new Date(log.created_at).toLocaleString('en-AU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
