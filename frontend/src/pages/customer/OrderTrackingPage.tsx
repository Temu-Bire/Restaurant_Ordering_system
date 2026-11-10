import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import OrderStatusStepper from "../../features/orders/components/OrderStatusStepper";
import type { OrderStatus } from "../../features/orders/types";
import { orders } from "../../mocks/orders";

const MESSAGES: Record<OrderStatus, string> = {
  pending: "Waiting for confirmation",
  confirmed: "Your order is confirmed",
  preparing: "Your order is being prepared!",
  ready: "Your order is ready!",
  completed: "Order completed. Enjoy!",
  cancelled: "This order was cancelled",
};

const CANCELLABLE: OrderStatus[] = ["pending", "confirmed", "preparing"];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const order = orders.find((o) => o.id === id);
  const [status, setStatus] = useState<OrderStatus | null>(null);

  if (!order) {
    return (
      <>
        <PageHeader title="Track Your Order" />
        <p className="text-muted">Order not found.</p>
      </>
    );
  }

  const current = status ?? order.status;
  const subtitle = `#${order.id}${order.table ? ` · Table ${order.table}` : ""}`;

  return (
    <>
      <PageHeader title="Track Your Order" description={subtitle} />

      <Card className="mx-auto max-w-md text-center">
        {current !== "cancelled" && <OrderStatusStepper status={current} />}

        <div className="mx-auto my-8 size-28 rounded-full border-4 border-primary bg-primary/10" />

        <h2 className="text-xl font-bold">{MESSAGES[current]}</h2>
        {["pending", "confirmed", "preparing"].includes(current) && (
          <p className="mt-2 text-[13px] text-muted">Estimated time: 15 min</p>
        )}

        <div className="mt-5 flex justify-center gap-3">
          <Link
            to={`/customer/orders/${order.id}/receipt`}
            className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            View Details
          </Link>

          {CANCELLABLE.includes(current) && (
            <Button variant="secondary" onClick={() => setStatus("cancelled")}>
              Cancel Order
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}