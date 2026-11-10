import { useState, type FormEvent } from "react";

import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Checkbox from "../../components/ui/Checkbox";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import {
  orderTypeOptions,
  paymentOptions,
  type OrderType,
  type PaymentMethod,
} from "../../features/orders/types";
import {
  operations as defaultOperations,
  restaurantInfo as defaultInfo,
} from "../../mocks/settings";

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

/* ---------- Restaurant info ---------- */
function RestaurantInfoForm() {
  const [form, setForm] = useState({
    name: defaultInfo.name,
    phone: defaultInfo.phone,
    address: defaultInfo.address,
    currency: defaultInfo.currency,
    taxRate: String(defaultInfo.taxRate),
  });
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    taxRate?: string;
  }>({});
  const [saved, setSaved] = useState(false);

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setSaved(false);
    };

  function submit(e: FormEvent) {
    e.preventDefault();

    const tax = Number(form.taxRate);
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Restaurant name is required";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (form.taxRate.trim() === "" || Number.isNaN(tax) || tax < 0 || tax > 100)
      next.taxRate = "Enter a tax rate between 0 and 100";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // TEMP: later calls settingsApi.save()
    setSaved(true);
  }

  return (
    <Card title="Restaurant Info">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input id="rest-name" label="Restaurant Name" value={form.name} onChange={set("name")} error={errors.name} />
        <Input id="rest-phone" label="Phone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
        <Input id="rest-address" label="Address" value={form.address} onChange={set("address")} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="rest-currency"
            label="Currency"
            value={form.currency}
            options={[
              { value: "USD", label: "USD ($)" },
              { value: "ETB", label: "ETB (Br)" },
            ]}
            onChange={set("currency")}
          />
          <Input
            id="rest-tax"
            label="Tax Rate (%)"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.taxRate}
            onChange={set("taxRate")}
            error={errors.taxRate}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit">Save</Button>
          {saved && <span className="text-[13px] text-success">Settings saved.</span>}
        </div>
      </form>
    </Card>
  );
}

/* ---------- Operations ---------- */
function OperationsForm() {
  const [orderTypes, setOrderTypes] = useState<OrderType[]>(defaultOperations.orderTypes);
  const [methods, setMethods] = useState<PaymentMethod[]>(defaultOperations.paymentMethods);
  const [fee, setFee] = useState(String(defaultOperations.deliveryFee));
  const [minimum, setMinimum] = useState(String(defaultOperations.lowStockMinimum));
  const [errors, setErrors] = useState<{
    orderTypes?: string;
    fee?: string;
    minimum?: string;
  }>({});
  const [saved, setSaved] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();

    const feeValue = Number(fee);
    const minValue = Number(minimum);
    const next: typeof errors = {};

    if (orderTypes.length === 0) next.orderTypes = "Enable at least one order type";
    if (fee.trim() === "" || Number.isNaN(feeValue) || feeValue < 0)
      next.fee = "Enter a fee of 0 or more";
    if (minimum.trim() === "" || Number.isNaN(minValue) || minValue < 0)
      next.minimum = "Enter a minimum of 0 or more";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // TEMP: later calls settingsApi.save()
    setSaved(true);
  }

  return (
    <Card title="Operations">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">Order Types Enabled</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {orderTypeOptions.map((o) => (
              <Checkbox
                key={o.value}
                label={o.label}
                checked={orderTypes.includes(o.value)}
                onChange={() => {
                  setOrderTypes((prev) => toggle(prev, o.value));
                  setSaved(false);
                }}
              />
            ))}
          </div>
          {errors.orderTypes && (
            <p className="mt-1.5 text-xs text-danger">{errors.orderTypes}</p>
          )}
        </fieldset>

        <Input
          id="ops-fee"
          label="Delivery Fee ($)"
          type="number"
          step="0.01"
          min="0"
          value={fee}
          onChange={(e) => {
            setFee(e.target.value);
            setSaved(false);
          }}
          error={errors.fee}
        />

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">Payment Methods</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {paymentOptions.map((o) => (
              <Checkbox
                key={o.value}
                label={o.value === "cash" ? "Cash (always on)" : o.label}
                checked={o.value === "cash" || methods.includes(o.value)}
                disabled={o.value === "cash"}
                onChange={() => {
                  setMethods((prev) => toggle(prev, o.value));
                  setSaved(false);
                }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Card and Mobile need a payment provider configured first.
          </p>
        </fieldset>

        <Input
          id="ops-min"
          label="Default Low-stock Minimum (kg)"
          type="number"
          min="0"
          value={minimum}
          onChange={(e) => {
            setMinimum(e.target.value);
            setSaved(false);
          }}
          error={errors.minimum}
        />

        <div className="flex items-center gap-3">
          <Button type="submit">Save</Button>
          {saved && <span className="text-[13px] text-success">Settings saved.</span>}
        </div>
      </form>
    </Card>
  );
}

/* ---------- Page ---------- */
export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Restaurant settings" />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <RestaurantInfoForm />
        <OperationsForm />
      </div>
    </>
  );
}