import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import type { Invoice } from "@/lib/supabase/types";

export default async function AdminInvoicesPage() {
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("admin.invoices");

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, customers(name)")
    .order("created_at", { ascending: false });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    issued: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-light text-brand-dark mb-6">{t("title")}</h1>

      {!invoices || invoices.length === 0 ? (
        <p className="text-brand-gray text-sm">{t("noInvoices")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-gray">
                <th className="py-3 px-2 font-medium">{t("invoiceNumber")}</th>
                <th className="py-3 px-2 font-medium">{t("date")}</th>
                <th className="py-3 px-2 font-medium">{t("customer")}</th>
                <th className="py-3 px-2 font-medium">{t("amount")}</th>
                <th className="py-3 px-2 font-medium">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {(invoices as (Invoice & { customers: { name: string } | null })[]).map((inv) => (
                <tr key={inv.id} className="border-b border-brand-border hover:bg-brand-light-gray transition-colors">
                  <td className="py-3 px-2 font-mono">{inv.invoice_number}</td>
                  <td className="py-3 px-2">
                    {new Date(inv.issued_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="py-3 px-2">{inv.customers?.name ?? "—"}</td>
                  <td className="py-3 px-2">€{(inv.amount_cents / 100).toFixed(2)}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {t(inv.status as "draft" | "issued" | "paid" | "cancelled")}
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
