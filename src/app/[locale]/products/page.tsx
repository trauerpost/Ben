import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Product, SizeOption } from "@/lib/supabase/types";

export default async function ProductsPage() {
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("products");

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-light text-brand-dark mb-3">{t("title")}</h1>
        <p className="text-brand-gray">{t("subtitle")}</p>
      </div>

      {!products || products.length === 0 ? (
        <p className="text-center text-brand-gray">Keine Produkte verfügbar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(products as Product[]).map((product) => {
            const sizeOptions = product.size_options as SizeOption[];
            const minPrice = sizeOptions.length > 0
              ? Math.min(...sizeOptions.map((s) => s.price_cents))
              : product.price_cents;

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group border border-brand-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-brand-light-gray flex items-center justify-center">
                  {product.preview_image_url ? (
                    <img
                      src={product.preview_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-brand-gray/30">📷</span>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-medium text-brand-dark group-hover:text-brand-primary transition-colors">
                    {product.name}
                  </h2>
                  {product.description && (
                    <p className="text-sm text-brand-gray mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <p className="text-sm text-brand-primary font-medium mt-3">
                    {t("startingAt")} €{(minPrice / 100).toFixed(2)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
