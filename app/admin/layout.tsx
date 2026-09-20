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
  Receipt,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { Session } from '@supabase/supabase-js'
import { checkIsAdminAction } from '@/app/actions/admin'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  children: NavItem[]
}

// Two-tier navigation: a narrow primary rail of categories, each opening a
// secondary panel of the pages inside it.
const navGroups: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    children: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: Calendar,
    children: [
      { label: 'Booking Leads', href: '/admin/bookings', icon: Calendar },
      { label: 'Manage Availability', href: '/admin/availability', icon: UserCheck },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    children: [
      { label: 'All Customers', href: '/admin/customers', icon: Users },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: Receipt,
    children: [
      { label: 'Invoices', href: '/admin/invoices', icon: Receipt },
    ],
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Globe,
    children: [
      { label: 'Website Leads', href: '/admin/website-leads', icon: Globe },
      { label: 'Tool Leads', href: '/admin/tool-leads', icon: Wrench },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FolderOpen,
    children: [
      { label: 'Document Templates', href: '/admin/document-templates', icon: FileText },
      { label: 'PDF Field Mapper', href: '/admin/pdf-editor', icon: FileCode },
      { label: 'Client Documents', href: '/admin/documents', icon: FolderOpen },
      { label: 'Signature Requests', href: '/admin/signature-requests', icon: Signature },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'General Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]

function isChildActive(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`))
}

function resolveActiveGroupId(pathname: string): string {
  const match = navGroups.find(group => group.children.some(child => isChildActive(pathname, child.href)))
  return match?.id ?? navGroups[0].id
}

/** "Group Label / Page Label" (or just the group label when it has one page) for the header breadcrumb. Plain function — not a hook — so it's safe to call after early returns. */
function getCurrentTitle(pathname: string): string {
  for (const group of navGroups) {
    const child = group.children.find(c => isChildActive(pathname, c.href))
    if (child) {
      return group.children.length > 1 ? `${group.label} / ${child.label}` : group.label
    }
  }
  return 'Admin Portal'
}

interface SidebarProps {
  pathname: string
  setSidebarOpen: (open: boolean) => void
  isCollapsed?: boolean
  setIsCollapsed?: React.Dispatch<React.SetStateAction<boolean>>
  isMobile?: boolean
}

function SidebarContent({ pathname, setSidebarOpen, isCollapsed = false, setIsCollapsed, isMobile = false }: SidebarProps) {
  // The group whose sub-panel is showing. Defaults to (and stays in sync
  // with) whichever group owns the current route, but a click on the
  // primary rail can switch it instantly for a snappier feel while the
  // route transition completes. Adjusted during render (not an effect) —
  // the recommended way to reset state when a prop-derived value changes.
  const routeGroupId = resolveActiveGroupId(pathname)
  const [openGroupId, setOpenGroupId] = useState(routeGroupId)
  const [syncedRouteGroupId, setSyncedRouteGroupId] = useState(routeGroupId)
  if (routeGroupId !== syncedRouteGroupId) {
    setSyncedRouteGroupId(routeGroupId)
    setOpenGroupId(routeGroupId)
  }

  const openGroup = navGroups.find(g => g.id === openGroupId) ?? navGroups[0]
  const collapsedDesktop = isCollapsed && !isMobile

  return (
    <div className="flex h-full text-white select-none">
      {/* ── Primary Rail ─────────────────────────────────────────────── */}
      <div
        className="flex flex-col h-full border-r border-white/10 transition-all duration-300 w-24 shrink-0"
        style={{ background: 'var(--color-admin-sidebar)' }}
      >
        {/* Brand mark */}
        <div className="pt-5 pb-4 border-b border-white/10 flex items-center justify-center">
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image src="/images/logo.jpg" alt="Migration Republic" fill className="object-contain rounded-full" sizes="40px" />
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navGroups.map(group => {
            const Icon = group.icon
            const active = group.id === routeGroupId
            const firstChild = group.children[0]

            return (
              <Link
                key={group.id}
                href={firstChild.href}
                onClick={() => {
                  setOpenGroupId(group.id)
                  setSidebarOpen(false)
                  // Clicking a category always reveals its pages — even if
                  // the sidebar was left collapsed from a previous visit.
                  setIsCollapsed?.(false)
                }}
                className="group relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-[10px] font-bold transition-all duration-200"
                style={active
                  ? { background: 'var(--color-admin-nav-active)', color: '#fff', boxShadow: '0 4px 14px rgba(228,2,41,0.3)' }
                  : { color: 'rgba(255,255,255,0.65)' }
                }
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--color-admin-nav-hover)'; (e.currentTarget as HTMLElement).style.color = '#fff' } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)' } }}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="truncate max-w-full">{group.label}</span>

                {/* Collapsed-desktop flyout: lets you jump straight to any
                    page in the group without opening the secondary panel */}
                {collapsedDesktop && (
                  group.children.length > 1 ? (
                    <div className="absolute left-full top-0 ml-3 w-52 py-2 bg-white text-gray-800 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50">
                      <p className="px-3.5 pb-1.5 mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">{group.label}</p>
                      {group.children.map(child => (
                        <span key={child.href} className={`block px-3.5 py-1.5 text-xs font-semibold ${isChildActive(pathname, child.href) ? 'text-[#e40229]' : 'text-gray-600'}`}>
                          {child.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
                      {group.label}
                    </div>
                  )
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle + Sign out */}
        <div className="p-2 border-t border-white/10 space-y-1.5">
          {!isMobile && setIsCollapsed && (
            <button
              onClick={() => setIsCollapsed(prev => !prev)}
              className="w-full flex items-center justify-center py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            title="Sign Out"
            className="w-full flex items-center justify-center py-2.5 rounded-xl text-red-300 hover:bg-red-500/15 hover:text-red-100 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Secondary Panel ──────────────────────────────────────────── */}
      {!collapsedDesktop && (
        <div
          className={`flex flex-col h-full border-r border-white/10 overflow-hidden transition-all duration-300 ${isMobile ? 'flex-1' : 'w-56 shrink-0'}`}
          style={{ background: 'color-mix(in srgb, var(--color-admin-sidebar), black 12%)' }}
        >
          {isMobile ? (
            /* Mobile: one scrollable column, every group shown with a header */
            <>
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
                <span className="font-extrabold text-sm tracking-wide text-white">Migration Republic</span>
                <button className="p-1.5 hover:bg-white/10 rounded-lg" onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
                {navGroups.map(group => (
                  <div key={group.id}>
                    <p className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-widest text-white/40">{group.label}</p>
                    <div className="space-y-1">
                      {group.children.map(child => {
                        const ChildIcon = child.icon
                        const active = isChildActive(pathname, child.href)
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={active ? { background: 'var(--color-admin-nav-active)', color: '#fff' } : { color: 'rgba(255,255,255,0.75)' }}
                          >
                            <ChildIcon className="w-4.5 h-4.5 shrink-0" />
                            <span className="truncate">{child.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Desktop: only the currently-open group's pages */
            <>
              <div className="pt-5 pb-4 px-5 border-b border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{openGroup.label}</p>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {openGroup.children.map(child => {
                  const ChildIcon = child.icon
                  const active = isChildActive(pathname, child.href)
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                      style={active ? { background: 'var(--color-admin-nav-active)', color: '#fff', boxShadow: '0 4px 14px rgba(228,2,41,0.3)' } : { color: 'rgba(255,255,255,0.70)' }}
                      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--color-admin-nav-hover)'; (e.currentTarget as HTMLElement).style.color = '#fff' } }}
                      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.70)' } }}
                    >
                      <ChildIcon className="w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      <span className="truncate">{child.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </>
          )}
        </div>
      )}
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
            <div className="relative w-24 h-24">
              <Image
                src="/images/logobgre.png"
                alt="Migration Republic"
                fill
                className="object-contain"
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

  // Breadcrumb title = the current page's label within its group
  const currentTitle = getCurrentTitle(pathname)

  return (
    <div className="min-h-screen flex text-gray-800" style={{ background: 'var(--color-admin-page)' }}>
      {/* Desktop Sidebar (Fixed & Collapsible) */}
      <aside className={`hidden md:block fixed inset-y-0 left-0 z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-24' : 'w-[20rem]'}`}>
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
          <aside className="relative w-80 max-w-[85vw] flex-shrink-0 z-40">
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
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'md:pl-24' : 'md:pl-[20rem]'}`}>
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
            <div className="relative w-8 h-8 shrink-0">
              <Image src="/images/logobgre.png" alt="Migration Republic" fill className="object-contain" sizes="32px" />
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
