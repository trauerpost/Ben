import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CreditBalance from "@/components/dashboard/CreditBalance";
import OrderHistory from "@/components/dashboard/OrderHistory";
import { Link } from "@/i18n/routing";
import type { Customer, Order } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-light text-brand-dark">Dashboard</h1>
        <Link
          href="/builder"
          className="px-5 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors text-sm"
        >
          + New Card
        </Link>
      </div>

      {customer && (
        <div className="mb-10">
          <CreditBalance customer={customer as Customer} />
        </div>
      )}

      <div>
        <h2 className="text-xl font-light text-brand-dark mb-4">
          Order History
        </h2>
        <OrderHistory orders={(orders as Order[]) ?? []} />
      </div>
    </section>
  );
}
