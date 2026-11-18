import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { PAYMENT_LABEL, type Order } from "../../features/orders/types";
import { getOrder } from "../../features/orders/ordersApi";
import { useTranslation } from "../../hooks/useTranslation";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

export default function ReceiptPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    getOrder(id)
      .then(setOrder)
      .catch((err) => console.error("Failed to load order receipt", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHeader title={t("receipt")} />
        <Card className="mx-auto max-w-md py-12 text-center text-muted rounded-2xl">
          {t("loading")}
        </Card>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <PageHeader title={t("receipt")} />
        <Card className="mx-auto max-w-md py-12 text-center text-muted rounded-2xl">
          <p>Receipt not found.</p>
          <Link to="/customer/menu" className="mt-3 inline-block font-semibold text-primary">
            {t("browseMenu")}
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("receipt")} description={`#${order.id}`} />

      <Card className="mx-auto max-w-md rounded-2xl shadow-sm">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-white shadow-xs">
              R
            </div>
            <span className="text-xl font-bold tracking-tight">RestroGo</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {t("receipt")} · #{order.id} · {formatDate(order.date)}
          </p>
        </div>

        <dl className="mt-5 space-y-1.5 border-y border-border py-3 text-xs text-muted">
          <div className="flex justify-between">
            <dt>{t("orderType")}</dt>
            <dd className="font-semibold text-foreground capitalize">{order.type}</dd>
          </div>
          {order.table && (
            <div className="flex justify-between">
              <dt>{t("tableNumber")}</dt>
              <dd className="font-semibold text-foreground">{order.table}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>{t("paymentMethod")}</dt>
            <dd className="font-semibold text-foreground">
              {PAYMENT_LABEL[order.payment?.method] ?? order.payment?.method ?? "Cash"}
            </dd>
          </div>
        </dl>

        <ul className="my-4 divide-y divide-border">
          {order.lines.map((line, idx) => (
            <li
              key={`${line.name}-${idx}`}
              className="flex items-center justify-between py-2 text-[13px]"
            >
              <span>
                {line.quantity} × {line.name}
              </span>
              <span className="font-semibold">
                {formatCurrency(line.price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between text-base font-bold text-foreground">
            <span>{t("total")}</span>
            <span className="text-xl text-primary font-black">{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
          <Button fullWidth onClick={() => window.print()}>
            {t("printReceipt")}
          </Button>
          <Link
            to="/customer/menu"
            className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-surface-secondary"
          >
            {t("browseMenu")}
          </Link>
        </div>
      </Card>
    </>
  );
}
