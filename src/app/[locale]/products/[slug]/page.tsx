import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import ProductOrderForm from "@/components/products/ProductOrderForm";
import type { Product } from "@/lib/supabase/types";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("products");

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) {
    notFound();
  }

  const typedProduct = product as Product;

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Product image */}
        <div className="aspect-square bg-brand-light-gray rounded-xl flex items-center justify-center">
          {typedProduct.preview_image_url ? (
            <img
              src={typedProduct.preview_image_url}
              alt={typedProduct.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-6xl text-brand-gray/30">📷</span>
          )}
        </div>

        {/* Product info + order form */}
        <div>
          <h1 className="text-3xl font-light text-brand-dark mb-3">{typedProduct.name}</h1>
          {typedProduct.description && (
            <p className="text-brand-gray mb-6">{typedProduct.description}</p>
          )}

          <ProductOrderForm product={typedProduct} isLoggedIn={!!user} />
        </div>
      </div>
    </section>
  );
}
