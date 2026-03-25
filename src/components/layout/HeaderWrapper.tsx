import { createServerSupabaseClient } from "@/lib/supabase/server";
import Header from "./Header";

export default async function HeaderWrapper(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let isLoggedIn = false;

  if (user) {
    isLoggedIn = true;
    const { data: customer } = await supabase
      .from("customers")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();
    isAdmin = customer?.role === "admin";
  }

  return <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} />;
}
