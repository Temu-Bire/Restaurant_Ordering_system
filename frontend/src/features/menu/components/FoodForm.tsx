import { useState, type FormEvent } from "react";

import Button from "../../../shared/components/ui/Button";
import Input from "../../../shared/components/ui/Input";
import Modal from "../../../shared/components/ui/Modal";
import Select from "../../../shared/components/ui/Select";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import type { Category, FoodItem } from "../types";

export interface FoodFormData {
  name: string;
  price: number;
  category: Category;
  description: string;
  image: File | null;
}

interface FoodFormModalProps {
  food: FoodItem | null; // null = adding a new item
  categories: { value: Category; label: string }[];
  onClose: () => void;
  onSave: (data: FoodFormData) => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function FoodFormModal({
  food,
  categories,
  onClose,
  onSave,
}: FoodFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(food?.name ?? "");
  const [price, setPrice] = useState(food ? String(food.price) : "");
  const [category, setCategory] = useState(
    food?.category ?? categories[0]?.value ?? ""
  );
  const [description, setDescription] = useState(food?.description ?? "");
  const [image, setImage] = useState<File | null>(null);

  const [errors, setErrors] = useState<{
    name?: string;
    price?: string;
    category?: string;
    image?: string;
  }>({});

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Use a PNG, JPG, or WebP image" }));
      setImage(null);
      return;
    }
    if (file && file.size > MAX_IMAGE_BYTES) {
      setErrors((prev) => ({ ...prev, image: "Image must be 5 MB or smaller" }));
      setImage(null);
      return;
    }

    setErrors((prev) => ({ ...prev, image: undefined }));
    setImage(file);
  }

  function submit(e: FormEvent) {
    e.preventDefault();

    const value = Number(price);
    const next: typeof errors = { image: errors.image };
    if (!name.trim()) next.name = "Food name is required";
    if (!category.trim()) next.category = "Category selection is required";
    if (!price.trim() || Number.isNaN(value) || value <= 0)
      next.price = "Price is required and must be greater than zero";

    setErrors(next);
    if (next.name || next.price || next.category || next.image) return;

    onSave({
      name: name.trim(),
      price: value,
      category,
      description: description.trim(),
      image,
    });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={food ? "Edit Food Item" : "Add Food Item"}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          id="food-name"
          label={`${t("foodName")} *`}
          placeholder="e.g. Doro Wot"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="food-category"
            label={`${t("foodCategory")} *`}
            value={category}
            options={categories}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            id="food-price"
            label={`${t("foodPrice")} *`}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="250.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={errors.price}
          />
        </div>

        <Input
          id="food-description"
          label="Description"
          placeholder="Traditional savory stew with chicken and spices"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex w-full flex-col gap-1.5">
          <label htmlFor="food-image" className="text-[13px] font-semibold text-foreground">
            {t("image")}
          </label>
          <input
            id="food-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={pickImage}
            className="w-full rounded-xl border border-border bg-surface-secondary px-3.5 py-2.5 text-[13px] text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
          />
          {errors.image ? (
            <span className="text-xs text-danger">{errors.image}</span>
          ) : (
            <span className="text-xs text-muted">PNG, JPG, or WebP up to 5 MB</span>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit">{food ? t("save") : t("create")}</Button>
        </div>
      </form>
    </Modal>
  );
}
