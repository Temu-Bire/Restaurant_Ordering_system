import { useState, useEffect } from "react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import FilterTabs from "../../../shared/components/ui/FilterTabs";
import Input from "../../../shared/components/ui/Input";
import Modal from "../../../shared/components/ui/Modal";
import Select from "../../../shared/components/ui/Select";
import TableTile from "../components/TableTile";
import type { RestaurantTable, TableStatus } from "../types";
import {
  listTables,
  createTable,
  updateTable as apiUpdateTable,
  deleteTable as apiDeleteTable,
} from "../api/tablesApi";
import { listOrders, assignTable } from "../../orders/api/ordersApi";
import type { Order } from "../../orders/types";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { useAuth } from "../../auth/hooks/useAuth";
import ConfirmDialog from "../../../shared/components/ui/ConfirmDialog";

type Filter = "all" | TableStatus;

/* ---------- Add / Edit modal ---------- */
interface TableFormProps {
  table: RestaurantTable | null;
  onClose: () => void;
  onSave: (name: string, seats: number) => void;
}

function TableFormModal({ table, onClose, onSave }: TableFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(table?.name ?? "");
  const [seats, setSeats] = useState(String(table?.seats ?? 4));
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const seatCount = Number(seats);
    if (!name.trim()) return setError("Table name is required");
    if (!Number.isInteger(seatCount) || seatCount < 1)
      return setError("Seats must be a whole number of at least 1");
    onSave(name.trim(), seatCount);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={table ? "Edit Table" : "Add Table"}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input id="tname" label="Table Name" placeholder="Table 9" value={name} onChange={(e) => setName(e.target.value)} />
        <Input id="tseats" label="Seats" type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} error={error} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function TablesPage({ role: propRole }: { role?: string } = {}) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const role = propRole ?? user?.role ?? "staff";

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<RestaurantTable | "new" | null>(null);
  const [toDelete, setToDelete] = useState<RestaurantTable | null>(null);

  const [orderId, setOrderId] = useState("");
  const [tableId, setTableId] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    listTables().then(setTables).catch(console.error);
    if (role === "staff") {
      listOrders()
        .then((all) => setOrders(all.filter((o) => o.status !== "completed" && o.status !== "cancelled")))
        .catch(console.error);
    }
  }, [role]);

  const visible = tables.filter((t) => (filter === "all" ? true : t.status === filter));

  async function saveTable(name: string, seats: number) {
    try {
      if (editing && editing !== "new") {
        const updated = await apiUpdateTable(editing.id, { name, seats });
        setTables((prev) => prev.map((t) => (t.id === editing.id ? updated : t)));
      } else {
        const created = await createTable({ name, seats });
        setTables((prev) => [...prev, created]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function deleteTable(table: RestaurantTable) {
    setToDelete(table);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await apiDeleteTable(toDelete.id);
      setTables((prev) => prev.filter((t) => t.id !== toDelete.id));
    } catch (err) {
      console.error(err);
    }
    setToDelete(null);
  }

  const orderOptions = [
    { value: "", label: "Select order..." },
    ...orders.map((o) => ({
      value: o.id,
      label: `#${o.id} · ${o.type} (${o.lines.reduce((s, l) => s + l.quantity, 0)} items)`,
    })),
  ];

  const tableOptions = [
    { value: "", label: "Select table..." },
    ...tables.map((t) => ({
      value: t.id,
      label: `${t.name} (${t.status})`,
    })),
  ];

  async function assign() {
    if (!orderId || !tableId) return;
    try {
      await assignTable(orderId, tableId);
      const chosen = tables.find((t) => t.id === tableId);
      setNotice(`Order #${orderId} assigned to ${chosen?.name ?? "table"}`);
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: "occupied" as TableStatus } : t))
      );
    } catch (err) {
      console.error(err);
    }
    setOrderId("");
    setTableId("");
  }

  return (
    <>
      <PageHeader
        title={t("navTables")}
        description={
          role === "admin"
            ? "Create and manage restaurant tables"
            : "Manage tables & assign dine-in orders"
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {role === "staff" ? (
          <div className="overflow-x-auto pb-1">
            <FilterTabs
              value={filter}
              onChange={setFilter}
              tabs={[
                { value: "all", label: t("all") },
                { value: "free", label: t("free") },
                { value: "occupied", label: t("occupied") },
                { value: "reserved", label: t("reserved") },
              ]}
            />
          </div>
        ) : (
          <span />
        )}
        {role === "admin" && (
          <Button onClick={() => setEditing("new")}>+ Add Table</Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((table) => (
          <TableTile
            key={table.id}
            table={table}
            detailed
            onEdit={role === "admin" ? () => setEditing(table) : undefined}
            onDelete={role === "admin" ? () => deleteTable(table) : undefined}
          />
        ))}
      </div>

      {role === "staff" && (
        <Card title="Assign Order to Table" className="mt-6 rounded-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row flex-wrap items-end gap-3">
            <div className="w-full sm:min-w-48 sm:flex-1">
              <Select id="order" value={orderId} options={orderOptions} onChange={(e) => setOrderId(e.target.value)} />
            </div>
            <div className="w-full sm:min-w-48 sm:flex-1">
              <Select id="table" value={tableId} options={tableOptions} onChange={(e) => setTableId(e.target.value)} />
            </div>
            <Button disabled={!orderId || !tableId} onClick={assign} className="w-full sm:w-auto">
              Assign
            </Button>
          </div>
          {notice && <p className="mt-3 text-[13px] text-success">{notice}</p>}
        </Card>
      )}

      {editing && (
        <TableFormModal
          key={editing === "new" ? "new" : editing.id}
          table={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={saveTable}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete table"
          message={`Delete table ${toDelete.name}?`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
