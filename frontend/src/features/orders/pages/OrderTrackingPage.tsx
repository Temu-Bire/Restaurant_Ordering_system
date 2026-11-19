import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import OrderStatusStepper from "../components/OrderStatusStepper";
import type { Order, OrderStatus } from "../types";
import { getOrder, cancelOrder } from "../api/ordersApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatCurrency } from "../../../shared/utils/formatCurrency";

const CANCELLABLE: OrderStatus[] = ["pending", "confirmed", "preparing"];

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null | undefined>(id ? undefined : null);

  useEffect(() => {
    if (!id) return;
    getOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [id]);

  const messages: Record<OrderStatus, string> = {
    pending: t("statusPending"),
    confirmed: t("statusConfirmed"),
    preparing: t("statusPreparing"),
    ready: t("statusReady"),
    completed: t("statusCompleted"),
    cancelled: t("statusCancelled"),
  };

  if (order === undefined) {
    return (
      <>
        <PageHeader title={t("trackYourOrder")} />
        <Card className="mx-auto max-w-lg py-12 text-center text-muted rounded-2xl">
          {t("loading")}
        </Card>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <PageHeader title={t("trackYourOrder")} />
        <Card className="mx-auto max-w-lg py-12 text-center text-muted rounded-2xl">
          <p>Order not found.</p>
          <Link to="/customer/menu" className="mt-3 inline-block font-semibold text-primary">
            {t("browseMenu")}
          </Link>
        </Card>
      </>
    );
  }

  const current = order.status;
  const subtitle = `#${order.id}${order.table ? ` · ${t("tableNumber")} ${order.table}` : ""}`;

  async function handleCancel() {
    if (!order) return;
    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <PageHeader title={t("trackYourOrder")} description={subtitle} />

      <div className="mx-auto max-w-xl space-y-6">
        <Card className="rounded-2xl shadow-sm">
          <div className="mb-6 text-center">
            <span className="text-3xl">🍲</span>
            <h2 className="mt-2 text-xl font-bold text-foreground">
              {messages[current]}
            </h2>
            <p className="mt-1 text-xs text-muted">{t("trackSubtitle")}</p>
          </div>

          <div className="overflow-x-auto py-2">
            <OrderStatusStepper status={current} />
          </div>
        </Card>

        {/* Order Details summary */}
        <Card title={t("itemsOrdered")} className="rounded-2xl shadow-sm">
          <ul className="divide-y divide-border">
            {order.lines.map((line, idx) => (
              <li
                key={`${line.name}-${idx}`}
                className="flex items-center justify-between py-2 text-[13px]"
              >
                <span>
                  {line.quantity} × {line.name}
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 font-bold text-foreground">
            <span>{t("total")}</span>
            <span className="text-lg text-primary">{formatCurrency(order.total)}</span>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/customer/orders/${order.id}/receipt`}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover"
          >
            {t("receipt")} →
          </Link>

          {CANCELLABLE.includes(current) && (
            <Button variant="danger" onClick={handleCancel} className="flex-1 rounded-xl">
              {t("cancel")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
