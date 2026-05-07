'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Session } from '@supabase/supabase-js'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      if (session) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle()
        
        setIsAdmin(!!adminData)
      }
      setLoading(false)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle()
        setIsAdmin(!!adminData)
      } else {
        setIsAdmin(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
          <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Admin Login</h2>
          
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get('email') as string;
              const password = formData.get('password') as string;
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) alert(error.message);
            }}
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Email</label>
              <input 
                name="email" 
                type="email" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Password</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-gray-900 dark:text-white">Admin Portal</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/admin" className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">Bookings</Link>
              <Link href="/admin/tool-leads" className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">Tool Leads</Link>
            </div>
          </div>
          
          <button 
            onClick={() => supabase.auth.signOut()}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </nav>
      <main className="p-4 sm:p-6 lg:p-8">
        {isAdmin === false && (
          <div className="max-w-7xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-red-900 font-bold">Access Denied: Not an Admin</h3>
                <p className="text-red-700 text-sm">Your account exists but is not listed in the <code className="bg-red-100 px-1 rounded">admins</code> table. You will not see any data below.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-red-600 font-medium">Your User ID:</p>
              <code className="bg-white px-3 py-1 rounded-lg border border-red-200 text-xs font-mono select-all">
                {session?.user.id}
              </code>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
