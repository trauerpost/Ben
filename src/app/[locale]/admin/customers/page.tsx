import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import type { Customer } from "@/lib/supabase/types";

export default async function AdminCustomersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-light text-brand-dark mb-6">Customers</h1>

      {!customers || customers.length === 0 ? (
        <p className="text-brand-gray">No customers yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-gray">
                <th className="py-3 px-2 font-medium">Name</th>
                <th className="py-3 px-2 font-medium">Email</th>
                <th className="py-3 px-2 font-medium">Company</th>
                <th className="py-3 px-2 font-medium">Type</th>
                <th className="py-3 px-2 font-medium">Credits</th>
                <th className="py-3 px-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {(customers as Customer[]).map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-brand-border hover:bg-brand-light-gray transition-colors"
                >
                  <td className="py-3 px-2">
                    <Link href={`/admin/customers/${c.id}`} className="text-brand-primary hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-3 px-2">{c.email}</td>
                  <td className="py-3 px-2">{c.company_name ?? "—"}</td>
                  <td className="py-3 px-2 capitalize">{c.customer_type}</td>
                  <td className="py-3 px-2">{c.credits_remaining}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        c.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
