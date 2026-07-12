import Stripe from 'stripe'
import { env } from './env'

export const stripe = new Stripe(env.STRIPE_KEY || 'sk_test_placeholder_key', {
  apiVersion: '2026-04-22.dahlia', // Use the version expected by the SDK types
  appInfo: {
    name: 'Migration Booking System',
    version: '0.1.0',
  },
})

