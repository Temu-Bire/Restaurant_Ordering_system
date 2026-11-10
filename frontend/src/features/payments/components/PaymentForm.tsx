import { useState, type FormEvent } from "react";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import {
  paymentOptions,
  type Order,
  type PaymentMethod,
} from "../../orders/types";
import { paymentStatusOptions } from "../types";

export interface PaymentInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  paid: boolean;
}

interface RecordPaymentFormProps {
  payableOrders: Order[];
  initialOrderId?: string;
  onSubmit: (input: PaymentInput) => void;
}

export default function RecordPaymentForm({
  payableOrders,
  initialOrderId,
  onSubmit,
}: RecordPaymentFormProps) {
  const totalOf = (id: string) =>
    (payableOrders.find((o) => o.id === id)?.total ?? 0).toFixed(2);

  const firstId = initialOrderId ?? payableOrders[0]?.id ?? "";

  const [orderId, setOrderId] = useState(firstId);
  const [amount, setAmount] = useState(totalOf(firstId));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [status, setStatus] = useState("paid");
  const [error, setError] = useState("");

  if (payableOrders.length === 0) {
    return <p className="text-[13px] text-muted">All orders are paid.</p>;
  }

  function changeOrder(id: string) {
    setOrderId(id);
    setAmount(totalOf(id));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);

    if (!amount.trim() || Number.isNaN(value) || value <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }

    setError("");
    onSubmit({ orderId, amount: value, method, paid: status === "paid" });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Select
        id="pay-order"
        label="Order"
        value={orderId}
        options={payableOrders.map((o) => ({ value: o.id, label: `#${o.id}` }))}
        onChange={(e) => changeOrder(e.target.value)}
      />
      <Input
        id="pay-amount"
        label="Amount ($)"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={error}
      />
      <Select
        id="pay-method"
        label="Method"
        value={method}
        options={paymentOptions}
        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
      />
      <Select
        id="pay-status"
        label="Status"
        value={status}
        options={paymentStatusOptions}
        onChange={(e) => setStatus(e.target.value)}
      />
      <Button type="submit" fullWidth>
        Save & Generate Receipt
      </Button>
    </form>
  );
}