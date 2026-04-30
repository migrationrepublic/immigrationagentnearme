import Link from 'next/link'
import { CheckCircle2, Calendar as CalendarIcon } from 'lucide-react'

export const metadata = {
  title: 'Booking Confirmed | Migration Agent Near Me',
  description: 'Your consultation booking is confirmed.',
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl text-center">
        
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Thank you for your payment. Your consultation has been successfully scheduled.
        </p>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 mb-8 text-left border border-gray-100 dark:border-gray-800">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            What happens next?
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>You will receive a confirmation email shortly.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>If you booked an online session, the meeting link is in the email.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>Please gather any relevant documents before our meeting.</span>
            </li>
          </ul>
        </div>

        <Link
          href="/"
          className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  )
}
