const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function check() {
  console.log("Checking stripe_events table...");
  const { data, error } = await supabase.from('stripe_events').select('*').limit(1);
  if (error) {
    console.error("Error with stripe_events:", error.message, error.code);
  } else {
    console.log("stripe_events table exists! Rows count limit 1:", data);
  }

  console.log("\nChecking bookings table...");
  const { data: bData, error: bError } = await supabase.from('bookings').select('*').limit(1);
  if (bError) {
    console.error("Error with bookings:", bError.message, bError.code);
  } else {
    console.log("bookings table exists! Rows count limit 1:", bData);
  }

  console.log("\nChecking availability table...");
  const { data: aData, error: aError } = await supabase.from('availability').select('*').limit(1);
  if (aError) {
    console.error("Error with availability:", aError.message, aError.code);
  } else {
    console.log("availability table exists! Rows count limit 1:", aData);
  }
}

check();
