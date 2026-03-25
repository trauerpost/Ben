import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import AddCreditsModal from "@/components/admin/AddCreditsModal";
import type { Customer, CreditTransaction, Order } from "@/lib/supabase/types";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("admin.customerDetail");
  const tCustomers = await getTranslations("admin.customers");

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) {
    redirect("/admin/customers");
  }

  const typedCustomer = customer as Customer;

  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Link
        href="/admin/customers"
        className="text-sm text-brand-primary hover:underline mb-6 inline-block"
      >
        ← {t("back")}
      </Link>

      {/* Customer Info Card */}
      <div className="bg-white border border-brand-border rounded-xl p-6 mb-8">
        <h1 className="text-2xl font-light text-brand-dark mb-4">{t("info")}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-brand-gray">{tCustomers("name")}:</span>{" "}
            <span className="font-medium">{typedCustomer.name}</span>
          </div>
          <div>
            <span className="text-brand-gray">{tCustomers("email")}:</span>{" "}
            <span>{typedCustomer.email}</span>
          </div>
          <div>
            <span className="text-brand-gray">{tCustomers("company")}:</span>{" "}
            <span>{typedCustomer.company_name ?? "—"}</span>
          </div>
          <div>
            <span className="text-brand-gray">{t("phone")}:</span>{" "}
            <span>{typedCustomer.phone ?? "—"}</span>
          </div>
          <div>
            <span className="text-brand-gray">{tCustomers("type")}:</span>{" "}
            <span className="capitalize">{typedCustomer.customer_type}</span>
          </div>
          <div>
            <span className="text-brand-gray">{tCustomers("role")}:</span>{" "}
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                typedCustomer.role === "admin"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {typedCustomer.role}
            </span>
          </div>
        </div>
      </div>

      {/* Credits Section */}
      <div className="bg-brand-light-green/30 border border-brand-border rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-light text-brand-dark">{t("creditsSection")}</h2>
          <AddCreditsModal customerId={typedCustomer.id} customerName={typedCustomer.name} />
        </div>
        <p className="text-sm text-brand-gray mb-1">{t("currentBalance")}</p>
        <p className="text-3xl font-light text-brand-dark">{typedCustomer.credits_remaining}</p>
      </div>

      {/* Transaction History */}
      <div className="mb-8">
        <h2 className="text-xl font-light text-brand-dark mb-4">{t("transactionHistory")}</h2>
        {!transactions || transactions.length === 0 ? (
          <p className="text-brand-gray text-sm">{t("noTransactions")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-gray">
                  <th className="py-3 px-2 font-medium">{t("date")}</th>
                  <th className="py-3 px-2 font-medium">{t("amount")}</th>
                  <th className="py-3 px-2 font-medium">{t("balanceAfter")}</th>
                  <th className="py-3 px-2 font-medium">{t("description")}</th>
                </tr>
              </thead>
              <tbody>
                {(transactions as CreditTransaction[]).map((tx) => (
                  <tr key={tx.id} className="border-b border-brand-border">
                    <td className="py-3 px-2">
                      {new Date(tx.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td className={`py-3 px-2 font-medium ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </td>
                    <td className="py-3 px-2">{tx.balance_after}</td>
                    <td className="py-3 px-2">{tx.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order History */}
      <div>
        <h2 className="text-xl font-light text-brand-dark mb-4">{t("orderHistory")}</h2>
        {!orders || orders.length === 0 ? (
          <p className="text-brand-gray text-sm">{t("noOrders")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-gray">
                  <th className="py-3 px-2 font-medium">{t("date")}</th>
                  <th className="py-3 px-2 font-medium">Type</th>
                  <th className="py-3 px-2 font-medium">Qty</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-2 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {(orders as Order[]).map((o) => (
                  <tr key={o.id} className="border-b border-brand-border">
                    <td className="py-3 px-2">
                      {new Date(o.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td className="py-3 px-2">{o.card_type ?? "—"}</td>
                    <td className="py-3 px-2">{o.quantity}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {o.price_cents ? `€${(o.price_cents / 100).toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
