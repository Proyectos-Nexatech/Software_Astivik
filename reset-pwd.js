const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function resetPassword() {
  console.log("Fetching users...");
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }

  const targetEmail = 'hse@astillero.com';
  const user = usersData.users.find(u => u.email === targetEmail);

  if (!user) {
    console.log(`User ${targetEmail} not found!`);
    return;
  }

  console.log(`Found user: ${user.id}. Resetting password to 1234567890...`);
  
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: '1234567890'
  });

  if (updateError) {
    console.error("Error updating password:", updateError);
  } else {
    console.log("Password reset successfully! You can now log in.");
  }
}

resetPassword();
