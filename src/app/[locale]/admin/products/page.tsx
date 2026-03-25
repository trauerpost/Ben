import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import type { Product } from "@/lib/supabase/types";

export default async function AdminProductsPage() {
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("admin.products");

  // Admin can see ALL products (active + inactive) via service role or RLS
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light text-brand-dark">{t("title")}</h1>
      </div>

      {!products || products.length === 0 ? (
        <p className="text-brand-gray text-sm">{t("noProducts")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-gray">
                <th className="py-3 px-2 font-medium">{t("name")}</th>
                <th className="py-3 px-2 font-medium">{t("category")}</th>
                <th className="py-3 px-2 font-medium">{t("price")}</th>
                <th className="py-3 px-2 font-medium">{t("active")}</th>
              </tr>
            </thead>
            <tbody>
              {(products as Product[]).map((p) => (
                <tr key={p.id} className="border-b border-brand-border hover:bg-brand-light-gray transition-colors">
                  <td className="py-3 px-2 font-medium">{p.name}</td>
                  <td className="py-3 px-2 capitalize">{p.category.replace("_", " ")}</td>
                  <td className="py-3 px-2">€{(p.price_cents / 100).toFixed(2)}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      p.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.is_active ? "✓" : "✗"}
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
