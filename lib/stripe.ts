import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key', {
  apiVersion: '2026-04-22.dahlia', // Use the latest stable version your types support or generic if specified
  appInfo: {
    name: 'Migration Booking System',
    version: '0.1.0',
  },
})
