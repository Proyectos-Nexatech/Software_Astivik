require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  // Try to create the bucket
  const { data, error } = await supabase.storage.createBucket('hse_docs', {
    public: true,
    allowedMimeTypes: ['application/pdf'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (error) {
    console.log("Error creating bucket (it might already exist):", error.message);
    
    // If it exists, let's update it to be public
    const { data: updateData, error: updateError } = await supabase.storage.updateBucket('hse_docs', {
      public: true,
      allowedMimeTypes: ['application/pdf'],
      fileSizeLimit: 5242880
    });
    
    if (updateError) {
      console.log("Error updating bucket:", updateError.message);
    } else {
      console.log("Bucket updated to public successfully.");
    }
  } else {
    console.log("Bucket created successfully:", data);
  }
}

main();
