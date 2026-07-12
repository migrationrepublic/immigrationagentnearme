'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Loader2,
  ShieldCheck,
  Menu,
  X,
  Calendar,
  FileText,
  Signature,
  Settings,
  Wrench,
  UserCheck,
  LogOut,
  FolderOpen,
  LayoutDashboard,
  FileCode,
  Globe
} from 'lucide-react'
import { Session } from '@supabase/supabase-js'
import { checkIsAdminAction } from '@/app/actions/admin'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  pathname: string
  setSidebarOpen: (open: boolean) => void
}

// Reusable Navigation Items Definition
const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Booking Leads', href: '/admin/bookings', icon: Calendar },
  { label: 'Website Leads', href: '/admin/website-leads', icon: Globe },
  { label: 'Tool Leads', href: '/admin/tool-leads', icon: Wrench },
  { label: 'Manage Availability', href: '/admin/availability', icon: UserCheck },
  { label: 'Document Templates', href: '/admin/document-templates', icon: FileText },
  { label: 'PDF Field Mapper', href: '/admin/pdf-editor', icon: FileCode },
  { label: 'Client Documents', href: '/admin/documents', icon: FolderOpen },
  { label: 'Signature Requests', href: '/admin/signature-requests', icon: Signature },
  { label: 'Site Settings', href: '/admin/settings', icon: Settings },
]

// Declared outside of render function to prevent state reset and satisfy React 19 rules
function SidebarContent({ pathname, setSidebarOpen }: SidebarProps) {
  const isActive = (href: string) => pathname === href

  return (
    <div className="flex flex-col h-full text-white border-r border-white/5" style={{ background: 'var(--color-admin-sidebar)' }}>
      {/* Brand Header — Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-white">
            <Image
              src="/images/logobgwhite.jpg"
              alt="Migration Republic"
              fill
              className="object-contain p-0.5"
              sizes="48px"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest leading-none" style={{ color: 'var(--color-admin-gold)' }}>
              Migration Republic
            </p>
            <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wider mt-0.5">
              Admin Portal
            </p>
          </div>
        </div>
        <button
          className="md:hidden p-1.5 hover:bg-white/10 rounded-lg shrink-0"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={active
                ? { background: 'var(--color-admin-nav-active)', color: '#fff', boxShadow: '0 4px 12px rgba(228,2,41,0.25)' }
                : { color: 'rgba(255,255,255,0.70)' }
              }
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--color-admin-nav-hover)'; if (!active) (e.currentTarget as HTMLElement).style.color = '#fff' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.70)' }}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all text-left"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session) {
        const res = await checkIsAdminAction()
        setIsAdmin(res.isAdmin)
      }
      setLoading(false)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        const res = await checkIsAdminAction()
        setIsAdmin(res.isAdmin)
      } else {
        setIsAdmin(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFC]">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--color-admin-navy)' }} />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--color-admin-sidebar)' }}>
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border shadow-2xl text-center" style={{ borderColor: 'var(--color-admin-card-border)' }}>
          {/* Logo on login screen */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 shadow-lg" style={{ borderColor: 'var(--color-admin-card-border)' }}>
              <Image
                src="/images/logobgwhite.jpg"
                alt="Migration Republic"
                fill
                className="object-contain p-1"
                sizes="96px"
              />
            </div>
          </div>
          <h2 className="admin-heading text-2xl mb-1">Admin Portal</h2>
          <p className="admin-subheading mb-8">Sign in to manage consultations and compliance files</p>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const email = formData.get('email') as string
              const password = formData.get('password') as string
              const { error } = await supabase.auth.signInWithPassword({ email, password })
              if (error) alert(error.message)
            }}
            className="space-y-4 text-left"
          >
            <div>
              <label className="admin-label block mb-1.5 ml-1">Email</label>
              <input
                name="email" type="email" required
                className="admin-input"
                placeholder="admin@migrationrepublic.com.au"
              />
            </div>
            <div>
              <label className="admin-label block mb-1.5 ml-1">Password</label>
              <input
                name="password" type="password" required
                className="admin-input"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="admin-btn-primary w-full justify-center mt-6"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex text-gray-800" style={{ background: 'var(--color-admin-page)' }}>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:block w-64 flex-shrink-0 fixed inset-y-0 left-0 z-20">
        <SidebarContent pathname={pathname} setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* Mobile Drawer Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 max-w-xs flex-shrink-0 z-40">
            <SidebarContent pathname={pathname} setSidebarOpen={setSidebarOpen} />
          </aside>
        </div>
      )}

      {/* Page Body Wrapper */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center border-b p-4" style={{ background: 'var(--color-admin-sidebar)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 bg-white shrink-0">
              <Image src="/images/logobgwhite.jpg" alt="Migration Republic" fill className="object-contain" sizes="32px" />
            </div>
            <span className="font-extrabold text-sm tracking-wide text-white">Migration Republic</span>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-white" />
          </button>
        </header>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {isAdmin === false && (
            <div className="mb-6">
              <div className="admin-error-bar rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-badge-error-bg)' }}>
                    <ShieldCheck className="w-6 h-6" style={{ color: 'var(--color-badge-error-text)' }} />
                  </div>
                  <div>
                    <h3 className="font-bold">Access Denied: Not an Admin</h3>
                    <p className="text-sm opacity-80">Your account is not registered in the admins table. Access is restricted.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="admin-label">User ID:</span>
                  <code className="bg-white px-3 py-1.5 rounded-lg border text-xs font-mono select-all" style={{ color: 'var(--color-badge-error-text)', borderColor: 'var(--color-badge-error-border)' }}>
                    {session?.user.id}
                  </code>
                </div>
              </div>
            </div>
          )}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
