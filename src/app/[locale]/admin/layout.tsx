import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (customer?.role !== "admin") {
    redirect("/dashboard");
  }

  // Count new orders (status = 'paid') for badge
  const { count: newOrderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "paid");

  return (
    <div className="flex min-h-[calc(100dvh-4rem)]">
      <AdminSidebar newOrderCount={newOrderCount ?? 0} />
      <div className="flex-1 p-6 md:ml-0">{children}</div>
    </div>
  );
}
