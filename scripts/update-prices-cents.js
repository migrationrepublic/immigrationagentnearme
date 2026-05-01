const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const priceUpdates = [
  { slug: 'phone-consultation', price_cents: 11407 },
  { slug: 'online-video-consultation', price_cents: 17111 },
  { slug: 'in-office-consultation', price_cents: 34221 },
];

async function updatePrices() {
  for (const update of priceUpdates) {
    console.log(`Updating ${update.slug} to ${update.price_cents} cents...`);
    const { data, error } = await supabase
      .from('plans')
      .update({ price_aud: update.price_cents })
      .eq('slug', update.slug);
    
    if (error) {
      console.error(`Error updating ${update.slug}:`, error);
    } else {
      console.log(`Successfully updated ${update.slug}.`);
    }
  }
  process.exit(0);
}

updatePrices();
