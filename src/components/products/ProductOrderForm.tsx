"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Product, SizeOption, MaterialOption } from "@/lib/supabase/types";

interface ProductOrderFormProps {
  product: Product;
  isLoggedIn: boolean;
}

export default function ProductOrderForm({ product, isLoggedIn }: ProductOrderFormProps) {
  const t = useTranslations("products");
  const sizeOptions = product.size_options as SizeOption[];
  const materialOptions = product.material_options as MaterialOption[];

  const [selectedSize, setSelectedSize] = useState(sizeOptions[0]?.id ?? "");
  const [selectedMaterial, setSelectedMaterial] = useState(materialOptions[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizePrice = sizeOptions.find((s) => s.id === selectedSize)?.price_cents ?? 0;
  const materialPrice = materialOptions.find((m) => m.id === selectedMaterial)?.price_cents ?? 0;
  const estimatedPrice = ((sizePrice + materialPrice) * quantity) / 100;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setError(t("photoTooLarge"));
      return;
    }

    // Validate MIME type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("photoInvalidType"));
      return;
    }

    setUploading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const timestamp = Date.now();
      const path = `uploads/${timestamp}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("product-photos")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("product-photos")
        .getPublicUrl(path);

      setPhotoUrl(publicUrl);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleOrder(): Promise<void> {
    if (!isLoggedIn) {
      const locale = window.location.pathname.split("/")[1] || "de";
      window.location.href = `/${locale}/login?redirect=/products/${product.slug}`;
      return;
    }

    if (product.requires_photo && !photoUrl) {
      setError(t("photoRequired"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          size_id: selectedSize,
          material_id: selectedMaterial || undefined,
          quantity,
          photo_url: photoUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Order failed");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Order failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-700 font-medium">{t("orderSuccess")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Size selector */}
      {sizeOptions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-2">
            {t("selectSize")}
          </label>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((size) => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size.id)}
                className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                  selectedSize === size.id
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-brand-border text-brand-gray hover:border-brand-dark"
                }`}
              >
                {size.label} — €{(size.price_cents / 100).toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Material selector */}
      {materialOptions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-2">
            {t("selectMaterial")}
          </label>
          <div className="flex flex-wrap gap-2">
            {materialOptions.map((material) => (
              <button
                key={material.id}
                onClick={() => setSelectedMaterial(material.id)}
                className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                  selectedMaterial === material.id
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-brand-border text-brand-gray hover:border-brand-dark"
                }`}
              >
                {material.label}
                {material.price_cents > 0 && ` (+€${(material.price_cents / 100).toFixed(2)})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photo upload */}
      {product.requires_photo && (
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-2">
            {t("uploadPhoto")}
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            className="block w-full text-sm text-brand-gray file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-brand-border file:text-sm file:bg-white file:text-brand-dark hover:file:bg-brand-light-gray"
          />
          <p className="text-xs text-brand-gray mt-1">{t("uploadPhotoHint")}</p>
          {uploading && <p className="text-xs text-brand-primary mt-1">{t("uploading")}</p>}
          {photoUrl && <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>}
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-2">
          {t("quantity")}
        </label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-24 px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>

      {/* Price estimate */}
      <div className="text-lg font-medium text-brand-dark">
        {t("estimatedPrice")} €{estimatedPrice.toFixed(2)}
      </div>

      {/* Order button */}
      <button
        onClick={handleOrder}
        disabled={loading || uploading}
        className="w-full py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
      >
        {loading
          ? "..."
          : isLoggedIn
            ? t("order")
            : t("loginToOrder")}
      </button>
    </div>
  );
}
