import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import Input from "../../../shared/components/ui/Input";
import OptionPicker from "../../../shared/components/ui/OptionPicker";
import { useCart } from "../hooks/useCart";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { createOrder } from "../../orders/api/ordersApi";
import { getSettings } from "../../settings/api/settingsApi";
import {
  type OrderType,
  type PaymentMethod,
} from "../../orders/types";
import { cn } from "../../../lib/cn";
import { formatCurrency } from "../../../shared/utils/formatCurrency";

export default function CartPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, count, subtotal, increase, decrease, removeItem, clear } =
    useCart();

  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [table, setTable] = useState("");
  const [tableError, setTableError] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const orderTypeOptions: { value: OrderType; label: string }[] = [
    { value: "dine-in", label: t("dineIn") },
    { value: "takeaway", label: t("takeaway") },
    { value: "delivery", label: t("delivery") },
  ];

  const paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: "cash", label: t("cash") },
    { value: "card", label: t("card") },
    { value: "mobile", label: t("mobile") },
  ];

  useEffect(() => {
    getSettings()
      .then((settings) => {
        if (typeof settings.deliveryFee === "number") {
          setDeliveryFee(settings.deliveryFee);
        }
      })
      .catch((err) => console.error("Failed to load settings in cart", err));
  }, []);

  const fee = orderType === "delivery" ? deliveryFee : 0;
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  const total = subtotal + fee + tax;

  async function placeOrder() {
    if (orderType === "dine-in" && !table.trim()) {
      setTableError(t("tableRequired"));
      return;
    }
    setTableError("");
    setSubmitError("");
    setSubmitting(true);

    try {
      const order = await createOrder({
        type: orderType,
        table: orderType === "dine-in" ? table.trim() : undefined,
        paymentMethod: payment,
        items: items.map((item) => ({ foodId: item.id, quantity: item.quantity })),
      });
      clear();
      navigate(`/customer/orders/${order.id}/track`);
    } catch (err: unknown) {
      console.error("Order creation failed", err);
      const msg = err instanceof Error ? err.message : "Failed to place order. Try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title={t("yourCart")} description="0 items" />
        <Card className="py-12 text-center rounded-2xl">
          <p className="text-base text-muted">{t("cartEmpty")}</p>
          <Link
            to="/customer/menu"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover"
          >
            {t("browseMenu")}
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("yourCart")}
        description={`${count} ${count === 1 ? "item" : "items"}`}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: items + order type */}
        <Card title={t("itemsOrdered")} className="rounded-2xl">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl shadow-xs",
                      item.gradient
                    )}
                  >
                    🍲
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1 text-sm shadow-xs">
                    <button
                      type="button"
                      onClick={() => decrease(item.id)}
                      aria-label={`Decrease ${item.name}`}
                      className="size-6 font-bold text-muted hover:text-foreground"
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => increase(item.id)}
                      aria-label={`Increase ${item.name}`}
                      className="size-6 font-bold text-primary hover:text-primary-hover"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1 text-muted hover:text-danger"
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <h3 className="mb-3 mt-6 text-sm font-bold text-foreground">{t("orderType")}</h3>
          <OptionPicker
            options={orderTypeOptions}
            value={orderType}
            onChange={setOrderType}
          />

          {orderType === "dine-in" && (
            <div className="mt-4">
              <Input
                id="table"
                label={t("tableNumber")}
                placeholder={t("tablePlaceholder")}
                value={table}
                onChange={(e) => setTable(e.target.value)}
                error={tableError}
              />
            </div>
          )}
        </Card>

        {/* Right: summary + payment */}
        <div className="space-y-6">
          <Card title="Summary" className="rounded-2xl">
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between text-muted">
                <dt>{t("subtotal")}</dt>
                <dd className="font-semibold text-foreground">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>{t("tax")}</dt>
                <dd className="font-semibold text-foreground">{formatCurrency(tax)}</dd>
              </div>
              {orderType === "delivery" && (
                <div className="flex justify-between text-muted">
                  <dt>{t("deliveryFee")}</dt>
                  <dd className="font-semibold text-foreground">{formatCurrency(fee)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-bold text-foreground">{t("total")}</span>
              <span className="text-2xl font-black text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </Card>

          <Card title={t("paymentMethod")} className="rounded-2xl">
            <OptionPicker
              options={paymentOptions}
              value={payment}
              onChange={setPayment}
            />
            {submitError && (
              <p className="mt-3 text-xs text-danger">{submitError}</p>
            )}
            <Button
              fullWidth
              size="lg"
              className="mt-5"
              disabled={submitting}
              onClick={placeOrder}
            >
              {submitting ? t("placingOrder") : `${t("placeOrder")} →`}
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
