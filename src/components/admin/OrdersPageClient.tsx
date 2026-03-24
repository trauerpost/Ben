"use client";

import { useState } from "react";
import type { Order } from "@/lib/supabase/types";
import OrdersList from "./OrdersList";
import OrderDetailModal from "./OrderDetailModal";

interface OrderWithCustomer extends Order {
  customers: { name: string; email: string } | null;
}

interface OrdersPageClientProps {
  initialOrders: OrderWithCustomer[];
}

export default function OrdersPageClient({
  initialOrders,
}: OrdersPageClientProps): React.JSX.Element {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(null);

  return (
    <>
      <OrdersList
        initialOrders={initialOrders}
        onOpenDetail={setSelectedOrder}
      />
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
