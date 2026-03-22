import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CardTemplate } from "@/lib/supabase/types";

export default async function AdminTemplatesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: templates } = await supabase
    .from("card_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-light text-brand-dark mb-6">Templates</h1>

      {!templates || templates.length === 0 ? (
        <p className="text-brand-gray">No templates yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-gray">
                <th className="py-3 px-2 font-medium">Name</th>
                <th className="py-3 px-2 font-medium">Category</th>
                <th className="py-3 px-2 font-medium">Tags</th>
                <th className="py-3 px-2 font-medium">Active</th>
                <th className="py-3 px-2 font-medium">Order</th>
              </tr>
            </thead>
            <tbody>
              {(templates as CardTemplate[]).map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-brand-border hover:bg-brand-light-gray transition-colors"
                >
                  <td className="py-3 px-2">{t.name}</td>
                  <td className="py-3 px-2 capitalize">{t.category}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1 flex-wrap">
                      {t.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-brand-light-gray text-brand-gray"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {t.is_active ? "✓" : "—"}
                  </td>
                  <td className="py-3 px-2">{t.sort_order}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
