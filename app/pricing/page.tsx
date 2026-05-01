import { getPlans } from '@/app/actions/booking'
import Link from 'next/link'
import { Check } from 'lucide-react'

export const metadata = {
  title: 'Consultation Plans | Migration Agent Near Me',
  description: 'Select a consultation plan to speak with our expert migration agents.',
}

export const revalidate = 3600 // Revalidate every hour

export default async function PricingPage() {
  const plans = await getPlans()

  // If Supabase isn't hooked up yet, plans might be empty.
  // Fallback for development/UI design:
  const displayPlans = plans.length > 0 ? plans : [
    { id: '1', slug: 'phone-consultation', name: 'Phone Consultation', price_aud: 11407, duration_minutes: 30, base_price: 100 },
    { id: '2', slug: 'online-video-consultation', name: 'Online Video Consultation', price_aud: 17111, duration_minutes: 45, base_price: 150 },
    { id: '3', slug: 'in-office-consultation', name: 'In-Office Consultation', price_aud: 34221, duration_minutes: 60, base_price: 300 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Choose Your Consultation Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Get expert advice tailored to your unique immigration case. Select the option that works best for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {displayPlans.map((plan: any, index: number) => {
            const isPopular = index === 1; // Highlight the middle plan
            
            return (
              <div 
                key={plan.id}
                className={`relative bg-white dark:bg-gray-900 rounded-3xl p-8 border transition-all hover:shadow-xl
                  ${isPopular 
                    ? 'border-blue-500 shadow-blue-900/20 shadow-lg md:-translate-y-4' 
                    : 'border-gray-200 dark:border-gray-800'
                  }
                `}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="flex flex-col mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${(plan.price_aud / 100).toFixed(2)}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">AUD</span>
                  </div>
                  <span className="text-sm text-gray-400 mt-1 font-medium">
                    ${plan.base_price || (plan.price_aud / 114.07 * 100 / 100).toFixed(0)} + GST
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-8 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="font-medium">{plan.duration_minutes} Minutes</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">Dedicated expert agent</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">Case assessment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">Actionable advice</span>
                  </li>
                </ul>

                <Link 
                  href={`/book/${plan.slug || plan.id}`}
                  className={`block w-full text-center py-4 rounded-xl font-semibold transition-all
                    ${isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  Continue
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
