import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load .env and .env.local
config({ path: ".env" });
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.supabase_url!;
const SERVICE_KEY = process.env.supabase_Secert!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAdminUser(): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "jess@trauerpost.com",
    password: "SoundGarden!",
    email_confirm: true,
  });

  if (authError) {
    // If user already exists, find them
    if (authError.message.includes("already")) {
      console.log("Auth user already exists, looking up...");
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existing = users?.find((u) => u.email === "jess@trauerpost.com");
      if (existing) {
        console.log("Found existing auth user:", existing.id);
        await ensureCustomerRow(existing.id);
      }
      return;
    }
    console.error("Auth error:", authError.message);
    return;
  }

  console.log("Auth user created:", authData.user.id);
  await ensureCustomerRow(authData.user.id);
}

async function ensureCustomerRow(authUserId: string): Promise<void> {
  // Check if customer row exists
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (existing) {
    // Update to admin
    await supabase.from("customers").update({ role: "admin" }).eq("id", existing.id);
    console.log("Updated existing customer to admin:", existing.id);
  } else {
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        email: "jess@trauerpost.com",
        name: "Jess",
        customer_type: "regular",
        role: "admin",
        credits_remaining: 0,
        auth_user_id: authUserId,
      })
      .select()
      .single();

    if (error) {
      console.error("Customer error:", error.message);
      return;
    }
    console.log("Admin customer created:", customer.id);
  }
  console.log("Done! Login: jess@trauerpost.com / SoundGarden!");
}

createAdminUser();
