import { useState, type FormEvent } from "react";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import type { Category, FoodItem } from "../types";

export interface FoodFormData {
  name: string;
  price: number;
  category: Category;
  description: string;
  available: boolean;
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
  const [name, setName] = useState(food?.name ?? "");
  const [price, setPrice] = useState(food ? String(food.price) : "");
  const [category, setCategory] = useState(
    food?.category ?? categories[0]?.value ?? ""
  );
  const [description, setDescription] = useState(food?.description ?? "");
  const [available, setAvailable] = useState(
    food ? (food.available ? "available" : "unavailable") : "available"
  );
  const [image, setImage] = useState<File | null>(null);

  const [errors, setErrors] = useState<{
    name?: string;
    price?: string;
    image?: string;
  }>({});

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (file && !["image/png", "image/jpeg"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Use a PNG or JPG image" }));
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
    if (!price.trim() || Number.isNaN(value) || value <= 0)
      next.price = "Enter a price above 0";

    setErrors(next);
    if (next.name || next.price || next.image) return;

    onSave({
      name: name.trim(),
      price: value,
      category,
      description: description.trim(),
      available: available === "available",
      image,
    });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={food ? "Edit Food Item" : "Add Food Item"}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          id="food-name"
          label="Food Name *"
          placeholder="Margherita Pizza"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="food-category"
            label="Category"
            value={category}
            options={categories}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            id="food-price"
            label="Price ($) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="12.99"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={errors.price}
          />
        </div>

        <Input
          id="food-description"
          label="Description"
          placeholder="Fresh pizza with tomato and cheese..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="food-availability"
            label="Availability"
            value={available}
            options={[
              { value: "available", label: "Available" },
              { value: "unavailable", label: "Unavailable" },
            ]}
            onChange={(e) => setAvailable(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="food-image" className="text-[13px] font-semibold">
              Image
            </label>
            <input
              id="food-image"
              type="file"
              accept="image/png,image/jpeg"
              onChange={pickImage}
              className="w-full rounded-lg border border-border bg-surface-secondary px-2 py-1.5 text-[13px] text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
            />
            {errors.image ? (
              <span className="text-xs text-danger">{errors.image}</span>
            ) : (
              <span className="text-xs text-muted">PNG or JPG, up to 5 MB</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Food</Button>
        </div>
      </form>
    </Modal>
  );
}