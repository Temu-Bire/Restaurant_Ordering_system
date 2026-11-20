import { useState, useEffect, type FormEvent } from "react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import DataTable, { type Column } from "../../../shared/components/ui/DataTable";
import FilterTabs from "../../../shared/components/ui/FilterTabs";
import Input from "../../../shared/components/ui/Input";
import Modal from "../../../shared/components/ui/Modal";
import FoodFormModal, {
  type FoodFormData,
} from "../components/FoodForm";
import type { FoodItem } from "../types";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import {
  listFoods,
  listCategories,
  createFood,
  updateFood,
  deleteFood as apideleteFood,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadFoodImage,
  mapApiFoodToFoodItem,
  type ApiCategory,
} from "../api/menuApi";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import ConfirmDialog from "../../../shared/components/ui/ConfirmDialog";

/* ---------- Category Management Modal (Create, Edit, Delete Categories) ---------- */
interface ManageCategoriesModalProps {
  categories: ApiCategory[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

function ManageCategoriesModal({ categories, onClose, onRefresh }: ManageCategoriesModalProps) {
  const [editingCat, setEditingCat] = useState<ApiCategory | null>(null);
  const [name, setName] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingCat, setDeletingCat] = useState<ApiCategory | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const label = newName.trim();
    if (!label) return setError("Category name is required");
    if (categories.some((c) => c.name.toLowerCase() === label.toLowerCase())) {
      return setError("That category already exists");
    }

    try {
      setLoading(true);
      setError("");
      await createCategory(label);
      setNewName("");
      setSuccess(`Category "${label}" created successfully.`);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingCat) return;
    const label = name.trim();
    if (!label) return setError("Category name is required");
    if (
      categories.some(
        (c) => c.id !== editingCat.id && c.name.toLowerCase() === label.toLowerCase()
      )
    ) {
      return setError("That category name already exists");
    }

    try {
      setLoading(true);
      setError("");
      await updateCategory(editingCat.id, label);
      setEditingCat(null);
      setName("");
      setSuccess(`Category updated to "${label}".`);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(category: ApiCategory) {
    try {
      setLoading(true);
      setError("");
      await deleteCategory(category.id);
      setSuccess(`Category "${category.name}" deleted.`);
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Cannot delete category with existing menu items"
      );
    } finally {
      setLoading(false);
      setDeletingCat(null);
    }
  }

  return (
    <>
      <Modal open onClose={onClose} title="Manage Categories">
        <div className="space-y-6">
          {/* Notification alerts */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-danger">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-success">
              {success}
            </div>
          )}

          {/* Add new category form */}
          <form onSubmit={handleCreate} className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Add New Category
            </h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="new-category"
                  label="Category Name"
                  placeholder="e.g. Traditional Stews"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setError("");
                  }}
                />
              </div>
              <Button type="submit" disabled={loading || !newName.trim()}>
                Add
              </Button>
            </div>
          </form>

          {/* Category list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Existing Categories ({categories.length})
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary/50 px-3.5 py-2.5"
                >
                  {editingCat?.id === c.id ? (
                    <form onSubmit={handleUpdate} className="flex flex-1 items-center gap-2">
                      <Input
                        id={`edit-${c.id}`}
                        label="Edit Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="py-1 text-xs"
                      />
                      <Button size="sm" type="submit" disabled={loading || !name.trim()}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={() => {
                          setEditingCat(null);
                          setName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground text-sm">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCat(c);
                            setName(c.name);
                            setError("");
                          }}
                          className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground transition-colors text-xs font-medium"
                          title="Edit Category Name"
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCat(c)}
                          className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-danger transition-colors text-xs font-medium"
                          title="Delete Category"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {deletingCat && (
        <ConfirmDialog
          title="Delete Category"
          message={`Are you sure you want to delete category "${deletingCat.name}"? If dishes belong to it, you must reassign or remove them first.`}
          onConfirm={() => handleDelete(deletingCat)}
          onCancel={() => setDeletingCat(null)}
        />
      )}
    </>
  );
}

/* ---------- Admin Menu Management Page ---------- */
export default function MenuManagementPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<FoodItem | "new" | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<FoodItem | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData() {
    try {
      const [foods, cats] = await Promise.all([listFoods(), listCategories()]);
      setItems(foods.map(mapApiFoodToFoodItem));
      setApiCategories(cats);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load menu data");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const categories = apiCategories.map((c) => ({
    value: c.name.toLowerCase(),
    label: c.name,
  }));

  const categoryLabel = (value: string) =>
    categories.find((c) => c.value === value || c.label.toLowerCase() === value)?.label ?? value;

  async function handleDirectUpload(foodId: string, file: File) {
    try {
      setErrorMessage("");
      await uploadFoodImage(foodId, file);
      setFeedbackMessage("Image updated successfully.");
      await loadData();
    } catch (err) {
      console.error("Direct image upload failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to upload image");
    }
  }

  async function saveFood(data: FoodFormData) {
    const { image, ...fields } = data;
    const matchedCat = apiCategories.find(
      (c) =>
        c.name.toLowerCase() === fields.category.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, "-") === fields.category.toLowerCase()
    );
    const categoryId = matchedCat?.id ?? apiCategories[0]?.id ?? "";

    try {
      setErrorMessage("");
      let targetId: string | null = editing && editing !== "new" ? editing.id : null;
      if (editing && editing !== "new") {
        await updateFood(editing.id, {
          name: fields.name,
          description: fields.description,
          price: fields.price,
          categoryId,
        });
        setFeedbackMessage(`Dish "${fields.name}" updated successfully.`);
      } else {
        const created = await createFood({
          name: fields.name,
          description: fields.description,
          price: fields.price,
          categoryId,
        });
        targetId = created.id;
        setFeedbackMessage(`Dish "${fields.name}" created successfully.`);
      }

      if (image && targetId) {
        try {
          await uploadFoodImage(targetId, image);
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      }

      await loadData();
    } catch (err) {
      console.error("Failed to save food item:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save food item");
    }
  }

  const q = search.trim().toLowerCase();
  const visible = items.filter(
    (f) =>
      (filter === "all" || f.category === filter) &&
      f.name.toLowerCase().includes(q)
  );

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      setErrorMessage("");
      await apideleteFood(toDelete.id);
      setItems((prev) => prev.filter((f) => f.id !== toDelete.id));
      setFeedbackMessage(`"${toDelete.name}" was deleted from the menu.`);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Cannot delete dish because it is referenced in past orders."
      );
    }
    setToDelete(null);
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
                if (file) void handleDirectUpload(f.id, file);
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
      cell: (f) => (
        <div className="flex items-center gap-1.5" title="Availability is managed by Staff (read-only for Admin)">
          {f.available ? (
            <Badge variant="active">{t("active")}</Badge>
          ) : (
            <Badge variant="disabled">{t("unavailable")}</Badge>
          )}
          <span className="text-[11px] text-muted font-normal">(Staff managed)</span>
        </div>
      ),
    },
    {
      header: t("actions"),
      className: "text-right",
      cell: (f) => (
        <div className="flex justify-end gap-3 text-muted">
          <button
            onClick={() => setEditing(f)}
            aria-label={`Edit ${f.name}`}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-primary hover:bg-surface-secondary transition-colors"
          >
            ✎ Edit
          </button>
          <button
            onClick={() => setToDelete(f)}
            aria-label={`Delete ${f.name}`}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-danger hover:bg-surface-secondary transition-colors"
          >
            🗑 Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("menuManagement")}
        description="Create dishes, edit details, and organize menu categories"
        search={{ value: search, onChange: setSearch }}
      />

      {feedbackMessage && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-success">
          <span>✓ {feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage("")} className="hover:opacity-75">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-danger">
          <span>⚠ {errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="hover:opacity-75">✕</button>
        </div>
      )}

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
          <Button variant="secondary" onClick={() => setManagingCategories(true)}>
            Manage Categories
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

      {managingCategories && (
        <ManageCategoriesModal
          categories={apiCategories}
          onClose={() => setManagingCategories(false)}
          onRefresh={loadData}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete food item"
          message={`Are you sure you want to delete "${toDelete.name}" from the menu? If this dish is in past orders, it cannot be deleted.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
