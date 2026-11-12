import { useState, type FormEvent } from "react";

import PageHeader from "../../components/layout/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DataTable, { type Column } from "../../components/ui/DataTable";
import FilterTabs from "../../components/ui/FilterTabs";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import FoodFormModal, {
  type FoodFormData,
} from "../../features/menu/components/FoodForm";
import { CATEGORIES, type FoodItem } from "../../features/menu/types";
import { cn } from "../../lib/cn";
import { menuItems } from "../../mocks/menu";
import { formatCurrency } from "../../utils/formatCurrency";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

/* ---------- Add category modal ---------- */
interface CategoryModalProps {
  existing: string[];
  onClose: () => void;
  onAdd: (label: string) => void;
}

function CategoryModal({ existing, onClose, onAdd }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const label = name.trim();

    if (!label) return setError("Category name is required");
    if (existing.includes(label.toLowerCase()))
      return setError("That category already exists");

    onAdd(label);
    onClose();
  }

  

  return (
    <Modal open onClose={onClose} title="Add Category">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          id="category-name"
          label="Category Name"
          placeholder="Soups"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add Category</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Page ---------- */
export default function MenuManagementPage() {
  const [items, setItems] = useState<FoodItem[]>(menuItems);
  const [categories, setCategories] = useState(CATEGORIES);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<FoodItem | "new" | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);

  const categoryLabel = (value: string) =>
    categories.find((c) => c.value === value)?.label ?? value;

  // TEMP: local state. Later these call menuApi (and upload the image)
  function saveFood(data: FoodFormData) {
    const { image, ...fields } = data;
    void image;

    if (editing && editing !== "new") {
      setItems((prev) =>
        prev.map((f) => (f.id === editing.id ? { ...f, ...fields } : f))
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          gradient: "from-orange-400 to-orange-600",
          ...fields,
        },
      ]);
    }
  }

  const [search, setSearch] = useState("");
const [toDelete, setToDelete] = useState<FoodItem | null>(null);

const q = search.trim().toLowerCase();
const visible = items.filter(
  (f) =>
    (filter === "all" || f.category === filter) &&
    f.name.toLowerCase().includes(q)
);

const deleteFood = (food: FoodItem) => setToDelete(food); // opens the dialog

function confirmDelete() {
  if (!toDelete) return;
  setItems((prev) => prev.filter((f) => f.id !== toDelete.id));
  setToDelete(null);
}

  function addCategory(label: string) {
    setCategories((prev) => [
      ...prev,
      { value: label.toLowerCase().replace(/\s+/g, "-"), label },
    ]);
  }

  const columns: Column<FoodItem>[] = [
    {
      header: "Food",
      cell: (f) => (
        <div className="flex items-center gap-3">
          <div className={cn("size-9 shrink-0 rounded-lg bg-gradient-to-br", f.gradient)} />
          <span className="font-medium">{f.name}</span>
        </div>
      ),
    },
    { header: "Category", cell: (f) => categoryLabel(f.category) },
    { header: "Price", cell: (f) => formatCurrency(f.price) },
    {
      header: "Status",
      cell: (f) =>
        f.available ? (
          <Badge variant="active">Active</Badge>
        ) : (
          <Badge variant="disabled">Unavailable</Badge>
        ),
    },
    {
      header: "Actions",
      cell: (f) => (
        <div className="flex gap-4 text-muted">
          <button
            onClick={() => setEditing(f)}
            aria-label={`Edit ${f.name}`}
            className="hover:text-foreground"
          >
            ✎
          </button>
          <button
            onClick={() => deleteFood(f)}
            aria-label={`Delete ${f.name}`}
            className="hover:text-danger"
          >
            🗑
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Menu Management"
        description="Add, update and delete food items"
        search={{ value: search, onChange: setSearch }}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[{ value: "all", label: "All" }, ...categories]}
        />
        <div className="flex gap-2">
          <Button onClick={() => setEditing("new")}>+ Add Food Item</Button>
          <Button variant="secondary" onClick={() => setAddingCategory(true)}>
            + Category
          </Button>
        </div>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={visible}
          getRowKey={(f) => f.id}
          emptyMessage="No food items in this category."
        />
      </Card>

      {editing && (
        <FoodFormModal
          key={editing === "new" ? "new" : editing.id}
          food={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={saveFood}
        />
      )}

      {addingCategory && (
        <CategoryModal
          existing={categories.flatMap((c) => [c.value, c.label.toLowerCase()])}
          onClose={() => setAddingCategory(false)}
          onAdd={addCategory}
        />
      )}
      {toDelete && (
    <ConfirmDialog
      title="Delete food item"
      message={`Delete "${toDelete.name}" from the menu?`}
      onConfirm={confirmDelete}
      onCancel={() => setToDelete(null)}
    />
  )}
    </>
  );
}