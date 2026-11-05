'use client'

import { useEffect } from 'react'

/**
 * Site-wide error boundary — friendly fallback instead of the technical
 * Next.js error screen. Full details are logged to the console.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Error boundary]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-[#f8fafc]">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 text-center shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-[#012269]">Something went wrong</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Sorry, this page couldn&apos;t load properly. Please try again, or come back in a few minutes.
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-[#012269] text-white text-sm font-semibold hover:bg-[#0a2f85] transition-colors"
        >
          Try again
        </button>
        {error.digest && (
          <p className="text-[10px] text-gray-400 font-mono">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
