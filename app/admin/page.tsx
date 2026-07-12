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
} from 'lucide-react'
import { format } from 'date-fns'

interface DashboardStats {
  todayBookings: number
  pendingDocs: number
  pendingSignatures: number
  websiteLeads: number
  toolLeads: number
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
    websiteLeads: 0,
    toolLeads: 0,
    revenue: 0,
  })
  const [activity, setActivity] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true)
        const todayStr = format(new Date(), 'yyyy-MM-dd')

        const { count: todayBookings } = await supabase
          .from('bookings').select('*', { count: 'exact', head: true }).eq('date', todayStr)
        const { count: pendingDocs } = await supabase
          .from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending_review')
        const { count: pendingSignatures } = await supabase
          .from('signature_requests').select('*', { count: 'exact', head: true }).eq('status', 'sent')
        const { count: websiteLeads } = await supabase
          .from('website_leads').select('*', { count: 'exact', head: true })
        const { count: toolLeads } = await supabase
          .from('tool_submissions').select('*', { count: 'exact', head: true })
        const { data: bookingsData } = await supabase
          .from('bookings').select('plans(price_aud)').eq('status', 'confirmed')

        let totalRev = 0
        const typed = bookingsData as unknown as Array<{ plans: { price_aud: number } | null }> | null
        typed?.forEach(b => { if (b.plans?.price_aud) totalRev += b.plans.price_aud })

        const { data: logsData } = await supabase
          .from('audit_logs').select('*').order('created_at', { ascending: false }).limit(12)

        setStats({
          todayBookings: todayBookings || 0,
          pendingDocs:   pendingDocs   || 0,
          pendingSignatures: pendingSignatures || 0,
          websiteLeads:  websiteLeads  || 0,
          toolLeads:     toolLeads     || 0,
          revenue:       totalRev / 100,
        })
        setActivity(logsData || [])
      } catch (e) {
        console.error('Error fetching dashboard stats:', e)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="admin-loader h-[60vh]">
        <Loader2 className="admin-loader-icon" />
      </div>
    )
  }

  // ── stat card config ────────────────────────────────────────────────────────
  const statCards = [
    { title: "Today's Bookings",   value: stats.todayBookings,                           icon: Calendar,  accent: 'text-[#012269] bg-[#012269]/8 border border-[#012269]/15' },
    { title: 'Pending Documents',  value: stats.pendingDocs,                             icon: FileText,  accent: 'text-amber-700 bg-amber-50 border border-amber-200' },
    { title: 'Pending Signatures', value: stats.pendingSignatures,                       icon: Signature, accent: 'text-[#E40229] bg-[#E40229]/8 border border-[#E40229]/15' },
    { title: 'Website Leads',      value: stats.websiteLeads,                            icon: Globe,     accent: 'text-blue-700 bg-blue-50 border border-blue-200' },
    { title: 'Tool Leads',         value: stats.toolLeads,                               icon: Wrench,    accent: 'text-purple-700 bg-purple-50 border border-purple-200' },
    { title: 'Total Revenue',      value: `$${stats.revenue.toLocaleString('en-AU')}`,   icon: DollarSign,accent: 'text-green-700 bg-green-50 border border-green-200' },
  ]

  return (
    <div className="admin-page">
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="admin-heading">Dashboard Overview</h1>
        <p className="admin-subheading">Real-time metrics, lead pipelines, and administrative audit logs.</p>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((c, i) => {
          const Icon = c.icon
          return (
            <div key={i} className="admin-card p-6 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="admin-label">{c.title}</p>
                <p className="admin-value mt-2">{c.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${c.accent}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Activity Log ──────────────────────────────────────────────────── */}
      <div className="admin-table-card">
        {/* Card header */}
        <div className="px-6 py-5 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-admin-card-border)' }}>
          <Activity className="w-5 h-5" style={{ color: 'var(--color-admin-red)' }} />
          <h2 className="admin-section-title mb-0">Recent Administrative Activity Logs</h2>
        </div>

        {activity.length === 0 ? (
          <p className="admin-cell-muted text-center py-10">No recent activity logs recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="admin-thead">
                <tr>
                  <th>Action Event</th>
                  <th>Module Type</th>
                  <th>Details Summary</th>
                  <th>Timestamp (AEST)</th>
                </tr>
              </thead>
              <tbody className="admin-tbody">
                {activity.map((log) => (
                  <tr key={log.id} className="admin-tr">
                    <td className="admin-td">
                      <span className={`admin-badge ${
                        log.action.includes('signed') || log.action.includes('approved')
                          ? 'admin-badge-success'
                          : log.action.includes('declined') || log.action.includes('rejected')
                            ? 'admin-badge-error'
                            : 'admin-badge-info'
                      }`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="admin-td admin-label">
                      {log.entity_type}
                    </td>
                    <td className="admin-td admin-cell-muted max-w-[280px] overflow-hidden text-ellipsis">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="admin-td admin-cell-muted">
                      {new Date(log.created_at).toLocaleString('en-AU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
