import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Asset } from "@/lib/supabase/types";
import WizardClient from "./WizardClient";

export default async function BuilderPage() {
  let assets: Asset[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("category", "background")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      assets = data as Asset[];
    }
  } catch {
    // Server-side fetch failed — WizardClient will fetch client-side
  }

  return <WizardClient initialAssets={assets} />;
}
