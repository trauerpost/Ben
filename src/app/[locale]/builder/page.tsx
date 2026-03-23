import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Asset } from "@/lib/supabase/types";
import WizardClient from "./WizardClient";

export default async function BuilderPage() {
  const supabase = await createServerSupabaseClient();

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("category", "background")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return <WizardClient initialAssets={(assets as Asset[]) ?? []} />;
}
