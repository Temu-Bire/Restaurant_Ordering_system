import { useState, useEffect } from "react";

import PageHeader from "../../components/layout/PageHeader";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import DataTable, { type Column } from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import StatCard from "../../components/ui/StatCard";
import RecordPaymentForm, {
  type PaymentInput,
} from "../../features/payments/components/PaymentForm";
import type { Payment } from "../../features/payments/types";
import { PAYMENT_LABEL, type PaymentMethod } from "../../features/orders/types";
import { listPayments, recordPayment } from "../../features/payments/paymentsApi";
import { listOrders } from "../../features/orders/ordersApi";
import type { Order } from "../../features/orders/types";
import { useTranslation } from "../../hooks/useTranslation";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

export default function PaymentsPage({ role }: { role: "staff" | "admin" }) {
  const { t } = useTranslation();
  const [list, setList] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prefillId, setPrefillId] = useState<string | undefined>();
  const [formKey, setFormKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    listPayments().then(setList).catch(console.error);
    listOrders().then(setOrders).catch(console.error);
  }, []);

  // Orders that still need a paid payment
  const payable = orders.filter(
    (o) =>
      o.status !== "cancelled" && !list.some((p) => p.orderId === o.id && p.paid)
  );

  const totalFor = (method: PaymentMethod) =>
    list
      .filter((p) => p.paid && p.method === method)
      .reduce((sum, p) => sum + p.amount, 0);

  async function record(input: PaymentInput) {
    try {
      await recordPayment(input);
      const updated = await listPayments();
      setList(updated);
    } catch (err) {
      console.error(err);
    }

    setPrefillId(undefined);
    setFormKey((k) => k + 1);
    setModalOpen(false);
  }

  function startRecord(orderId: string) {
    setPrefillId(orderId);
    setFormKey((k) => k + 1);
    if (role === "admin") setModalOpen(true);
  }

  const columns: Column<Payment>[] = [
    { header: "Receipt", cell: (p) => p.receipt ?? "—" },
    { header: "Order", cell: (p) => `#${p.orderId}` },
    { header: "Amount", cell: (p) => formatCurrency(p.amount) },
    { header: "Method", cell: (p) => PAYMENT_LABEL[p.method] },
    {
      header: "Status",
      cell: (p) => (
        <Badge variant={p.paid ? "paid" : "unpaid"}>{p.paid ? "Paid" : "Unpaid"}</Badge>
      ),
    },
    { header: "Time", cell: (p) => formatTimeAgo(p.date) },
    {
      header: "",
      className: "text-right",
      cell: (p) =>
        p.paid ? (
          <button onClick={() => window.print()} className="font-semibold text-primary">
            Print
          </button>
        ) : (
          <button onClick={() => startRecord(p.orderId)} className="font-semibold text-primary">
            Record
          </button>
        ),
    },
  ];

  const table = (
    <Card>
      <DataTable columns={columns} data={list} getRowKey={(p) => p.id} />
    </Card>
  );

  const form = (
    <RecordPaymentForm
      key={formKey}
      payableOrders={payable}
      initialOrderId={prefillId}
      onSubmit={record}
    />
  );

  return (
    <>
      <PageHeader
        title={t("navPayments")}
        description={
          role === "admin"
            ? "Recorded payments & receipts"
            : "Record payments & generate receipts"
        }
      />

      {role === "admin" && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <StatCard label="Today (Cash)" value={formatCurrency(totalFor("cash"))} icon="💵" tone="primary" />
          <StatCard label="Today (Card)" value={formatCurrency(totalFor("card"))} icon="💳" tone="info" />
          <StatCard label="Today (Mobile)" value={formatCurrency(totalFor("mobile"))} icon="📱" tone="purple" />
        </div>
      )}

      {role === "staff" ? (
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
          {table}
          <Card title="Record Payment">{form}</Card>
        </div>
      ) : (
        <>
          {table}
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
            {form}
          </Modal>
        </>
      )}
    </>
  );
}
