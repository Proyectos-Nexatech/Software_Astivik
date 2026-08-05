require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDB() {
  const mockWorkers = [
    { nombre: "Andrés Felipe Gómez", empresa: "Metalprest S.A.S" }
  ];
  const { data, error } = await supabase.from('trabajadores').insert(mockWorkers).select();
  console.log("Insert Error:", error);
  console.log("Insert Data:", data);
}

testDB();
