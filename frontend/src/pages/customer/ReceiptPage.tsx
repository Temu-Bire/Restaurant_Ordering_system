import { useParams } from "react-router-dom";

import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { PAYMENT_LABEL } from "../../features/orders/types";
import { orders } from "../../mocks/orders";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

export default function ReceiptPage() {
  const { id } = useParams();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <>
        <PageHeader title="Receipt" />
        <p className="text-muted">Receipt not found.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Receipt" description="Payment confirmation" />

      <Card className="mx-auto max-w-md">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-white">
              R
            </div>
            <span className="text-xl font-bold">RestroGo</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Receipt · #{order.id} · {formatDate(order.date)}
          </p>
        </div>

        <ul className="mt-4 space-y-1.5 border-y border-dashed border-border py-4 text-[13px]">
          {order.lines.map((line) => (
            <li key={line.name} className="flex justify-between">
              <span>
                {line.name} x{line.quantity}
              </span>
              <span>{formatCurrency(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between text-[13px]">
          <span>Payment</span>
          <span>
            {PAYMENT_LABEL[order.payment.method]} ·{" "}
            {order.payment.paid ? "Paid" : "Unpaid"}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[13px] font-bold">Total</span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(order.total)}
          </span>
        </div>

        <Button fullWidth className="mt-5 print:hidden" onClick={() => window.print()}>
          Download / Print Receipt
        </Button>
      </Card>
    </>
  );
}