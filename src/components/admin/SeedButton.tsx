"use client";

import { useState } from "react";

export default function SeedButton(): React.JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Only show in development
  if (process.env.NODE_ENV === "production") return null;

  async function handleSeed(): Promise<void> {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Seeded: ${data.summary.customers} customers, ${data.summary.orders} orders, ${data.summary.promoCodes} promo codes`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setResult("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCleanup(): Promise<void> {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup" }),
      });
      if (res.ok) {
        setResult("Seed data cleaned up");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const data = await res.json();
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 p-4 rounded-xl border border-dashed border-orange-300 bg-orange-50">
      <p className="text-xs font-medium text-orange-600 uppercase tracking-wider mb-3">
        Dev Only — Test Data
      </p>
      <div className="flex gap-3 items-center">
        <button
          onClick={handleSeed}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Working..." : "Seed Test Data"}
        </button>
        <button
          onClick={handleCleanup}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-orange-300 text-orange-700 text-sm font-medium hover:bg-orange-100 transition-colors disabled:opacity-50"
        >
          Cleanup
        </button>
      </div>
      {result && (
        <p className="mt-2 text-sm text-orange-700">{result}</p>
      )}
    </div>
  );
}
