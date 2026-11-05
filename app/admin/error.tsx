'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * Admin error boundary — replaces Next.js's technical
 * "Application error / Server Components render" screen with a friendly one.
 * The full error (and digest, which matches the server log) goes to the console.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin error boundary]', error)
  }, [error])

  return (
    <div className="admin-page">
      <div className="max-w-md mx-auto mt-16 admin-card-padded text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-admin-heading)' }}>
          Something went wrong
        </h2>
        <p className="admin-cell-muted text-sm leading-relaxed">
          This page couldn&apos;t load properly. Please try again. If the problem continues,
          refresh the page or sign in again.
        </p>
        <button type="button" onClick={reset} className="admin-btn-primary inline-flex justify-center mx-auto">
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
        {error.digest && (
          <p className="text-[10px] text-gray-400 font-mono">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
