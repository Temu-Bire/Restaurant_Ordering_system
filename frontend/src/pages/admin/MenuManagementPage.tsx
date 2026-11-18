import { useState, useEffect, type FormEvent } from "react";

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
import type { FoodItem } from "../../features/menu/types";
import { useTranslation } from "../../hooks/useTranslation";
import {
  listFoods,
  listCategories,
  createFood,
  updateFood,
  deleteFood as apideleteFood,
  createCategory,
  uploadFoodImage,
  mapApiFoodToFoodItem,
  type ApiCategory,
} from "../../features/menu/menuApi";
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
  const { t } = useTranslation();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<FoodItem | "new" | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<FoodItem | null>(null);

  useEffect(() => {
    listFoods()
      .then((foods) => setItems(foods.map(mapApiFoodToFoodItem)))
      .catch(console.error);
    listCategories().then(setApiCategories).catch(console.error);
  }, []);

  const categories = apiCategories.map((c) => ({
    value: c.name.toLowerCase(),
    label: c.name,
  }));

  const categoryLabel = (value: string) =>
    categories.find((c) => c.value === value || c.label.toLowerCase() === value)?.label ?? value;

  async function handleDirectUpload(foodId: string, file: File) {
    try {
      await uploadFoodImage(foodId, file);
      const fresh = await listFoods();
      setItems(fresh.map(mapApiFoodToFoodItem));
    } catch (err) {
      console.error("Direct image upload failed:", err);
    }
  }

  async function saveFood(data: FoodFormData) {
    const { image, ...fields } = data;
    // find the categoryId from apiCategories by matching the label
    const matchedCat = apiCategories.find(
      (c) =>
        c.name.toLowerCase() === fields.category.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, "-") === fields.category.toLowerCase()
    );
    const categoryId = matchedCat?.id ?? apiCategories[0]?.id ?? "";

    try {
      let targetId: string | null = editing && editing !== "new" ? editing.id : null;
      if (editing && editing !== "new") {
        await updateFood(editing.id, {
          name: fields.name,
          description: fields.description,
          price: fields.price,
          categoryId,
          isAvailable: fields.available,
        });
      } else {
        const created = await createFood({
          name: fields.name,
          description: fields.description,
          price: fields.price,
          categoryId,
          isAvailable: fields.available,
        });
        targetId = created.id;
      }

      if (image && targetId) {
        try {
          await uploadFoodImage(targetId, image);
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      }

      const fresh = await listFoods();
      setItems(fresh.map(mapApiFoodToFoodItem));
    } catch (err) {
      console.error("Failed to save food item:", err);
    }
  }

  const q = search.trim().toLowerCase();
  const visible = items.filter(
    (f) =>
      (filter === "all" || f.category === filter) &&
      f.name.toLowerCase().includes(q)
  );

  const deleteFoodItem = (food: FoodItem) => setToDelete(food);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await apideleteFood(toDelete.id);
      setItems((prev) => prev.filter((f) => f.id !== toDelete.id));
    } catch (err) {
      console.error(err);
    }
    setToDelete(null);
  }

  async function addCategory(label: string) {
    try {
      const created = await createCategory(label);
      setApiCategories((prev) => [...prev, created]);
    } catch (err) {
      console.error(err);
    }
  }

  const columns: Column<FoodItem>[] = [
    {
      header: t("image"),
      className: "w-20",
      cell: (f) => (
        <div className="relative group size-12 shrink-0 rounded-xl overflow-hidden border border-border bg-surface-secondary flex items-center justify-center">
          <img
            src={f.imageUrl || "/default-food.png"}
            alt={f.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/default-food.png";
            }}
          />
          <label
            className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-[10px] font-semibold"
            title={`${t("uploadImage")}: ${f.name}`}
          >
            <span className="text-sm">📷</span>
            <span className="leading-tight">+ Image</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleDirectUpload(f.id, file);
              }}
            />
          </label>
        </div>
      ),
    },
    {
      header: t("foodName"),
      cell: (f) => (
        <div>
          <span className="font-bold text-foreground block">{f.name}</span>
          {f.description && (
            <span className="text-xs text-muted line-clamp-1 max-w-xs">{f.description}</span>
          )}
        </div>
      ),
    },
    { header: t("foodCategory"), cell: (f) => categoryLabel(f.category) },
    { header: t("foodPrice"), cell: (f) => formatCurrency(f.price) },
    {
      header: t("foodStatus"),
      cell: (f) =>
        f.available ? (
          <Badge variant="active">{t("active")}</Badge>
        ) : (
          <Badge variant="disabled">{t("unavailable")}</Badge>
        ),
    },
    {
      header: t("actions"),
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
            onClick={() => deleteFoodItem(f)}
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
        title={t("menuManagement")}
        description={t("menuManagementDesc")}
        search={{ value: search, onChange: setSearch }}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="overflow-x-auto pb-1">
          <FilterTabs
            value={filter}
            onChange={setFilter}
            tabs={[{ value: "all", label: t("all") }, ...categories]}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setEditing("new")}>{t("addFoodItem")}</Button>
          <Button variant="secondary" onClick={() => setAddingCategory(true)}>
            {t("addCategory")}
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={visible}
          getRowKey={(f) => f.id}
          emptyMessage={t("noDishesFound")}
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
