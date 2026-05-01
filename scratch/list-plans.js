const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listPlans() {
  const { data, error } = await supabase.from('plans').select('*');
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

listPlans();
