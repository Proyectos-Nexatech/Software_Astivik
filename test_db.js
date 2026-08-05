require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDB() {
  const { data, error } = await supabase.from('documentos_hse').select('*').limit(1);
  if (error) {
    console.error("Error querying documentos_hse:", error.message);
  } else {
    console.log("Success! documentos_hse exists. Data:", data);
  }

  const { data: wData, error: wError } = await supabase.from('trabajadores').select('*').limit(1);
  if (wError) {
    console.error("Error querying trabajadores:", wError.message);
  } else {
    console.log("Success! trabajadores exists. Data:", wData);
  }
}

testDB();
