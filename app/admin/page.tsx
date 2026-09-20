'use client'

import React, { useEffect, useState } from 'react'
import { getDashboardStatsAction } from '@/app/actions/admin'
import {
  Wrench,
  Globe,
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
  toolLeadsSponsorCount: number
  toolLeadsCostCount: number
  toolLeadsApplicantCostCount: number
  revenue: number
}

interface AuditLog {
  id: string
  action: string
  entity_type: string
  created_at: string
  details: Record<string, unknown>
}

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="admin-card-padded space-y-1">
      <p className="admin-label">{label}</p>
      <p className="admin-value text-xl sm:text-2xl">{value}</p>
    </div>
  )
}

function MiniTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--color-admin-table-head)', border: '1px solid var(--color-admin-card-border)' }}>
      <span className="admin-cell-muted block">{label}</span>
      <span className="text-xl font-bold mt-1 block" style={{ color: 'var(--color-admin-heading)' }}>{value}</span>
    </div>
  )
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
    toolLeadsSponsorCount: 0,
    toolLeadsCostCount: 0,
    toolLeadsApplicantCostCount: 0,
    revenue: 0,
  })
  const [recentWebsiteLeads, setRecentWebsiteLeads] = useState<DetailedWebsiteLead[]>([])
  const [recentToolLeads, setRecentToolLeads] = useState<DetailedToolLead[]>([])
  const [activity, setActivity] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'website' | 'tool' | 'audit'>('website')
  const [refreshing, setRefreshing] = useState(false)

  // Single server round trip: fans out to Supabase server-side with the
  // service-role client (no RLS re-check per row, minimal columns per query)
  // instead of ~7 separate full-table browser queries.
  async function applyDashboardStats() {
    const { stats: dashboardStats, recentWebsiteLeads: rwl, recentToolLeads: rtl, activity: log } =
      await getDashboardStatsAction()
    setStats(dashboardStats)
    setRecentWebsiteLeads(rwl as DetailedWebsiteLead[])
    setRecentToolLeads(rtl as unknown as DetailedToolLead[])
    setActivity(log as AuditLog[])
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        await applyDashboardStats()
      } catch (e) {
        console.error('Error fetching dashboard stats:', e)
      } finally {
        if (!ignore) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await applyDashboardStats()
    } catch (e) {
      console.error('Error refreshing dashboard stats:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loader h-[60vh]">
        <Loader2 className="admin-loader-icon animate-spin" />
      </div>
    )
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="admin-heading">Overview</h1>
          <p className="admin-subheading">Key performance metrics and lead activity across your portal.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {/* Top Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatTile label="Today's Bookings" value={stats.todayBookings} />
        <StatTile
          label="Website Leads"
          value={
            <span className="flex items-center gap-2">
              {stats.websiteLeadsTotal}
              {stats.websiteLeadsNew > 0 && (
                <span className="admin-badge admin-badge-warn text-[10px] px-1.5 py-0">{stats.websiteLeadsNew} new</span>
              )}
            </span>
          }
        />
        <StatTile label="Tool Submissions" value={stats.toolLeadsTotal} />
        <StatTile label="Pending Review" value={stats.pendingDocs} />
        <StatTile label="Signatures Sent" value={stats.pendingSignatures} />
        <StatTile label="Total Revenue" value={`$${stats.revenue.toLocaleString('en-AU')}`} />
      </div>

      {/* Website Leads vs Tool Leads breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card-padded flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--color-admin-navy), white 90%)' }}>
                <Globe className="w-5 h-5" style={{ color: 'var(--color-admin-navy)' }} />
              </div>
              <div>
                <h2 className="admin-cell-primary text-base">Website Contact Inquiries</h2>
                <p className="admin-cell-muted">Forms submitted on migrationrepublic.com.au</p>
              </div>
            </div>
            <Link
              href="/admin/website-leads"
              className="flex items-center gap-1 text-xs font-bold hover:underline"
              style={{ color: 'var(--color-admin-navy)' }}
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniTile label="New" value={stats.websiteLeadsNew} />
            <MiniTile label="Contacted" value={stats.websiteLeadsContacted} />
            <MiniTile label="In Progress" value={stats.websiteLeadsInProgress} />
            <MiniTile label="Archived" value={stats.websiteLeadsArchived} />
          </div>
        </div>

        <div className="admin-card-padded flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--color-admin-navy), white 90%)' }}>
                <Wrench className="w-5 h-5" style={{ color: 'var(--color-admin-navy)' }} />
              </div>
              <div>
                <h2 className="admin-cell-primary text-base">Interactive Tool Submissions</h2>
                <p className="admin-cell-muted">Points calculators, 482 visa checkers &amp; quizzes</p>
              </div>
            </div>
            <Link
              href="/admin/tool-leads"
              className="flex items-center gap-1 text-xs font-bold hover:underline"
              style={{ color: 'var(--color-admin-navy)' }}
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <MiniTile label="Sponsor Quick" value={stats.toolLeadsSponsorCount} />
            <MiniTile label="Cost Estimator" value={stats.toolLeadsCostCount} />
            <MiniTile label="Applicant Cost" value={stats.toolLeadsApplicantCostCount} />
            <MiniTile label="482 Checker" value={stats.toolLeads482Count} />
            <MiniTile label="PR Calc" value={stats.toolLeadsPRCount} />
            <MiniTile label="Eligibility" value={stats.toolLeadsEligibilityCount} />
            <MiniTile label="Visa Quiz" value={stats.toolLeadsQuizCount} />
          </div>
        </div>
      </div>

      {/* Tabbed Activity Feed */}
      <div className="admin-table-card">
        <div className="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--color-admin-card-border)' }}>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-admin-page)' }}>
            {(['website', 'tool', 'audit'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                style={activeTab === tab
                  ? { background: '#fff', color: 'var(--color-admin-heading)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
                  : { color: 'var(--color-admin-subtext)' }
                }
              >
                {tab === 'website' ? `Website Leads (${recentWebsiteLeads.length})`
                  : tab === 'tool' ? `Tool Submissions (${recentToolLeads.length})`
                  : `Audit Logs (${activity.length})`}
              </button>
            ))}
          </div>

          <Link
            href={activeTab === 'website' ? '/admin/website-leads' : activeTab === 'tool' ? '/admin/tool-leads' : '/admin'}
            className="text-xs font-bold hover:underline"
            style={{ color: 'var(--color-admin-navy)' }}
          >
            View full log &rarr;
          </Link>
        </div>

        {/* Tab Content */}
        {activeTab === 'website' && (
          <div className="overflow-x-auto">
            {recentWebsiteLeads.length === 0 ? (
              <p className="text-center text-xs py-10" style={{ color: 'var(--color-admin-subtext)' }}>No recent website leads found.</p>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="admin-thead">
                  <tr>
                    <th>Lead Contact</th>
                    <th>Subject / Message</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="admin-tbody">
                  {recentWebsiteLeads.map((lead) => (
                    <tr key={lead.id} className="admin-tr">
                      <td className="admin-td">
                        <p className="admin-cell-primary">
                          {lead.first_name || lead.last_name ? `${lead.first_name || ''} ${lead.last_name || ''}` : 'Anonymous Contact'}
                        </p>
                        <p className="admin-cell-muted">{lead.email}</p>
                      </td>
                      <td className="admin-td max-w-xs truncate">
                        <p className="admin-cell-primary truncate">{lead.subject || 'No Subject'}</p>
                        <p className="admin-cell-muted truncate">{lead.message || '—'}</p>
                      </td>
                      <td className="admin-td">
                        <span className="admin-badge admin-badge-navy capitalize">
                          {(lead.status || 'new').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="admin-td admin-cell-muted">
                        {format(new Date(lead.created_at), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="admin-td text-right">
                        <Link href="/admin/website-leads" className="admin-cell-primary hover:underline">
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
              <p className="text-center text-xs py-10" style={{ color: 'var(--color-admin-subtext)' }}>No recent tool submissions found.</p>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="admin-thead">
                  <tr>
                    <th>User Contact</th>
                    <th>Tool Name</th>
                    <th>Result / Score</th>
                    <th>Submitted</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="admin-tbody">
                  {recentToolLeads.map((lead) => {
                    const isPR = lead.tool_name === 'PR Calculator' || lead.tool_name === 'PR Points Calculator'
                    const isCostEstimator = lead.tool_name?.includes('Cost Estimator') || lead.tool_name?.includes('Sponsorship Cost')
                    const isApplicantCost = lead.tool_name?.includes('Applicant Cost')
                    return (
                      <tr key={lead.id} className="admin-tr">
                        <td className="admin-td">
                          <p className="admin-cell-primary">{lead.user_name}</p>
                          <p className="admin-cell-muted">{lead.user_email}</p>
                        </td>
                        <td className="admin-td admin-cell-primary">{lead.tool_name}</td>
                        <td className="admin-td">
                          {isPR ? (
                            <span className="admin-cell-primary">{(lead.results?.totalPoints as number) ?? 0} Points</span>
                          ) : isCostEstimator ? (
                            <span className="admin-cell-primary">{(lead.results?.grand_total_government_charges as string) ?? 'Assessed'}</span>
                          ) : isApplicantCost ? (
                            <span className="admin-cell-primary">{(lead.results?.total_visa_application_charges as string) ?? 'Assessed'}</span>
                          ) : (
                            <span className="admin-cell-muted">Assessed</span>
                          )}
                        </td>
                        <td className="admin-td admin-cell-muted">
                          {format(new Date(lead.created_at), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="admin-td text-right">
                          <Link href="/admin/tool-leads" className="admin-cell-primary hover:underline">
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
              <p className="text-center text-xs py-10" style={{ color: 'var(--color-admin-subtext)' }}>No recent audit activity.</p>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="admin-thead">
                  <tr>
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody className="admin-tbody">
                  {activity.map((log) => (
                    <tr key={log.id} className="admin-tr">
                      <td className="admin-td">
                        <span className="admin-badge admin-badge-navy capitalize">{log.action.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="admin-td admin-cell-primary">{log.entity_type}</td>
                      <td className="admin-td max-w-[280px] truncate admin-cell-muted">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="admin-td admin-cell-muted">
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
