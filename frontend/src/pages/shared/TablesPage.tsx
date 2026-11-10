import { useState } from "react";

import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import FilterTabs from "../../components/ui/FilterTabs";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import TableTile from "../../features/tables/components/TableTile";
import type { RestaurantTable, TableStatus } from "../../features/tables/types";
import { allOrders } from "../../mocks/allOrders";
import { tables as initialTables } from "../../mocks/tables";

type Filter = "all" | TableStatus;

/* ---------- Add / Edit modal ---------- */
interface TableFormProps {
  table: RestaurantTable | null; // null = adding a new table
  onClose: () => void;
  onSave: (name: string, seats: number) => void;
}

function TableFormModal({ table, onClose, onSave }: TableFormProps) {
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
        <Input id="tname" label="Table Name" placeholder="T11" value={name} onChange={(e) => setName(e.target.value)} />
        <Input id="tseats" label="Seats" type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} error={error} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Table</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Page ---------- */
export default function TablesPage({ role }: { role: "staff" | "admin" }) {
  const [list, setList] = useState<RestaurantTable[]>(initialTables);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<RestaurantTable | "new" | null>(null);

  const [orderId, setOrderId] = useState("");
  const [tableId, setTableId] = useState("");
  const [notice, setNotice] = useState("");

  const visible = list.filter((t) => filter === "all" || t.status === filter);

  const orderOptions = [
    { value: "", label: "Select order" },
    ...allOrders
      .filter((o) => o.type === "dine-in" && !["completed", "cancelled"].includes(o.status))
      .map((o) => ({ value: o.id, label: `Order #${o.id}` })),
  ];
  const tableOptions = [
    { value: "", label: "Select table" },
    ...list.filter((t) => t.status === "free").map((t) => ({ value: t.id, label: `Table ${t.name}` })),
  ];

  // TEMP: local state. Later these call tablesApi
  function saveTable(name: string, seats: number) {
    if (editing && editing !== "new") {
      setList((prev) => prev.map((t) => (t.id === editing.id ? { ...t, name, seats } : t)));
    } else {
      setList((prev) => [...prev, { id: crypto.randomUUID(), name, seats, status: "free" }]);
    }
  }

  function deleteTable(table: RestaurantTable) {
    if (window.confirm(`Delete table ${table.name}?`)) {
      setList((prev) => prev.filter((t) => t.id !== table.id));
    }
  }

  function assign() {
    const table = list.find((t) => t.id === tableId);
    setList((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: "occupied" } : t)));
    setNotice(`Order #${orderId} assigned to table ${table?.name}.`);
    setOrderId("");
    setTableId("");
  }

  return (
    <>
      <PageHeader
        title="Tables"
        description={
          role === "admin"
            ? "Create and manage restaurant tables"
            : "Manage tables & assign dine-in orders"
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {role === "staff" ? (
          <FilterTabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: "all", label: "All" },
              { value: "free", label: "Free" },
              { value: "occupied", label: "Occupied" },
              { value: "reserved", label: "Reserved" },
            ]}
          />
        ) : (
          <span />
        )}
        <Button onClick={() => setEditing("new")}>+ Add Table</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
        <Card title="Assign Order to Table" className="mt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <Select id="order" value={orderId} options={orderOptions} onChange={(e) => setOrderId(e.target.value)} />
            </div>
            <div className="min-w-48 flex-1">
              <Select id="table" value={tableId} options={tableOptions} onChange={(e) => setTableId(e.target.value)} />
            </div>
            <Button disabled={!orderId || !tableId} onClick={assign}>
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
    </>
  );
}