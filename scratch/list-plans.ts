import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function listPlans() {
  try {
    const { data, error } = await supabase.from('plans').select('*')
    if (error) {
      console.error('Error fetching plans:', error)
      process.exit(1)
    }
    console.log('Current Plans:')
    console.log(JSON.stringify(data, null, 2))
    process.exit(0)
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

listPlans()
