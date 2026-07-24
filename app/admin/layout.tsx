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
  Wrench,
  UserCheck,
  LogOut,
  FolderOpen,
  LayoutDashboard,
  FileCode,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { Session } from '@supabase/supabase-js'
import { checkIsAdminAction } from '@/app/actions/admin'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  pathname: string
  setSidebarOpen: (open: boolean) => void
  isCollapsed?: boolean
  setIsCollapsed?: React.Dispatch<React.SetStateAction<boolean>>
  isMobile?: boolean
}

// Reusable Navigation Items Definition (Removed Site Settings as requested)
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
]

function SidebarContent({ pathname, setSidebarOpen, isCollapsed = false, setIsCollapsed, isMobile = false }: SidebarProps) {
  const isActive = (href: string) => pathname === href

  return (
    <div className="flex flex-col h-full text-white border-r border-white/10 select-none transition-all duration-300" style={{ background: 'var(--color-admin-sidebar)' }}>
      {/* Brand Header — Logo */}
      <div className={`pt-5 pb-4 border-b border-white/10 flex items-center ${isCollapsed && !isMobile ? 'justify-center px-2' : 'justify-between px-5'}`}>
        <div className={`flex items-center gap-3 ${isCollapsed && !isMobile ? 'justify-center' : 'min-w-0'}`}>
          <div className="relative w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-white">
            <Image
              src="/images/logobgwhite.jpg"
              alt="Migration Republic"
              fill
              className="object-contain p-0.5"
              sizes="40px"
            />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="min-w-0 transition-opacity duration-200">
              <p className="text-[11px] font-black uppercase tracking-widest leading-none truncate" style={{ color: 'var(--color-admin-gold)' }}>
                Migration Republic
              </p>
              <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wider mt-0.5">
                Admin Portal
              </p>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            className="p-1.5 hover:bg-white/10 rounded-lg shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const collapsedDesktop = isCollapsed && !isMobile

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              title={collapsedDesktop ? item.label : undefined}
              className={`group relative flex items-center ${collapsedDesktop ? 'justify-center px-2 py-3' : 'gap-3.5 px-3.5 py-2.5'} rounded-xl text-sm font-semibold transition-all duration-200`}
              style={active
                ? { background: 'var(--color-admin-nav-active)', color: '#fff', boxShadow: '0 4px 14px rgba(228,2,41,0.3)' }
                : { color: 'rgba(255,255,255,0.70)' }
              }
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--color-admin-nav-hover)'; if (!active) (e.currentTarget as HTMLElement).style.color = '#fff' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.70)' }}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {(!isCollapsed || isMobile) && (
                <span className="truncate">{item.label}</span>
              )}
              {/* Tooltip on hover when sidebar is collapsed */}
              {collapsedDesktop && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle Footer & Sign Out */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {!isMobile && setIsCollapsed && (
          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {!isCollapsed && <span>Collapse Sidebar</span>}
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        )}

        <button
          onClick={() => supabase.auth.signOut()}
          title={isCollapsed && !isMobile ? "Sign Out" : undefined}
          className={`w-full flex items-center ${isCollapsed && !isMobile ? 'justify-center px-2' : 'gap-3 px-3.5'} py-2.5 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-500/15 hover:text-red-100 transition-all text-left group relative`}
        >
          <LogOut className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {(!isCollapsed || isMobile) && <span>Sign Out</span>}
          {isCollapsed && !isMobile && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-red-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
              Sign Out
            </div>
          )}
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('admin_sidebar_collapsed')
      return savedState === 'true'
    }
    return false
  })
  const pathname = usePathname()

  // Persist sidebar state
  const handleSetIsCollapsed: React.Dispatch<React.SetStateAction<boolean>> = (value) => {
    setIsCollapsed(prev => {
      const next = typeof value === 'function' ? value(prev) : value
      localStorage.setItem('admin_sidebar_collapsed', String(next))
      return next
    })
  }

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

  // Get active item title for top header title
  const activeNavItem = navItems.find(item => item.href === pathname)
  const currentTitle = activeNavItem ? activeNavItem.label : 'Admin Portal'

  return (
    <div className="min-h-screen flex text-gray-800" style={{ background: 'var(--color-admin-page)' }}>
      {/* Desktop Sidebar (Fixed & Collapsible) */}
      <aside className={`hidden md:block fixed inset-y-0 left-0 z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent
          pathname={pathname}
          setSidebarOpen={setSidebarOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={handleSetIsCollapsed}
        />
      </aside>

      {/* Mobile Drawer Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 max-w-xs flex-shrink-0 z-40">
            <SidebarContent
              pathname={pathname}
              setSidebarOpen={setSidebarOpen}
              isCollapsed={false}
              isMobile={true}
            />
          </aside>
        </div>
      )}

      {/* Page Body Wrapper */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        {/* Desktop Top Header Navigation Bar */}
        <header className="hidden md:flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200/80 sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSetIsCollapsed(prev => !prev)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-400">Admin</span>
              <span>/</span>
              <span className="font-bold text-[#012269]">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Online Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Portal Active
            </div>

            {/* Admin Profile Details */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#012269] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {session.user.email?.[0].toUpperCase() || 'A'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[180px]">
                  {session.user.email}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center border-b p-4 sticky top-0 z-10" style={{ background: 'var(--color-admin-sidebar)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 bg-white shrink-0">
              <Image src="/images/logobgwhite.jpg" alt="Migration Republic" fill className="object-contain" sizes="32px" />
            </div>
            <span className="font-extrabold text-sm tracking-wide text-white">Migration Republic</span>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Content View — FULL WIDTH CANVAS */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-full">
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
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

