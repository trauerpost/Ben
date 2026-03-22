import type { Customer } from "@/lib/supabase/types";

interface CreditBalanceProps {
  customer: Customer;
}

export default function CreditBalance({ customer }: CreditBalanceProps) {
  return (
    <div className="p-6 rounded-xl bg-brand-primary-light border border-brand-primary/20">
      <p className="text-sm text-brand-gray mb-1">Credits remaining</p>
      <p className="text-4xl font-light text-brand-primary">
        {customer.credits_remaining}
      </p>
      {customer.customer_type === "regular" && (
        <p className="text-xs text-brand-gray mt-2">
          {customer.company_name ?? customer.name} — Regular account
        </p>
      )}
    </div>
  );
}
