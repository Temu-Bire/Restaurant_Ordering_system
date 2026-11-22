import { useState } from "react";
import { AlertTriangle, Trash2, UtensilsCrossed } from "lucide-react";
import Modal from "../../../shared/components/ui/Modal";
import Button from "../../../shared/components/ui/Button";
import ConfirmDialog from "../../../shared/components/ui/ConfirmDialog";
import StarRating from "./StarRating";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { createReview, updateReview, deleteReview } from "../api/reviewsApi";
import type { Review } from "../types";

interface ReviewModalProps {
  open: boolean;
  orderItemId: string;
  foodName: string;
  foodImage?: string | null;
  orderNumber?: number;
  initialReview?: Review | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ReviewModal({
  open,
  orderItemId,
  foodName,
  foodImage,
  orderNumber,
  initialReview,
  onClose,
  onSaved,
}: ReviewModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(initialReview?.rating ?? 5);
  const [comment, setComment] = useState<string>(initialReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError(t("ratingRequired") || "Please select a rating between 1 and 5 stars");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (initialReview) {
        await updateReview(initialReview.id, {
          rating,
          comment: comment.trim() || undefined,
        });
      } else {
        await createReview({
          orderItemId,
          rating,
          comment: comment.trim() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initialReview) return;
    setSubmitting(true);
    try {
      await deleteReview(initialReview.id);
      setShowDeleteConfirm(false);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={initialReview ? t("editReview") : t("rateDish")}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-danger">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Food Info Header */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-secondary/40 p-3">
            <div className="size-12 shrink-0 rounded-xl overflow-hidden bg-surface-secondary border border-border flex items-center justify-center">
              {foodImage ? (
                <img
                  src={foodImage}
                  alt={foodName}
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/default-food.png";
                  }}
                />
              ) : (
                <UtensilsCrossed className="size-5 text-muted" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-foreground text-sm truncate">{foodName}</h4>
              {orderNumber && (
                <p className="text-xs text-muted">
                  {t("order")} #{orderNumber} · {t("verifiedPurchase")}
                </p>
              )}
            </div>
          </div>

          {/* Interactive Star Selection */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-4 text-center">
            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
              {t("yourRating")}
            </label>
            <StarRating
              value={rating}
              size="lg"
              interactive
              onChange={(val) => {
                setRating(val);
                setError("");
              }}
            />
            <span className="mt-2 text-xs font-semibold text-primary">
              {rating === 5 && (t("starExcellent") || "Excellent (5 Stars)")}
              {rating === 4 && (t("starVeryGood") || "Very Good (4 Stars)")}
              {rating === 3 && (t("starGood") || "Good (3 Stars)")}
              {rating === 2 && (t("starFair") || "Fair (2 Stars)")}
              {rating === 1 && (t("starPoor") || "Poor (1 Star)")}
            </span>
          </div>

          {/* Optional Review Comment */}
          <div>
            <label className="text-xs font-bold text-muted block mb-1.5">
              {t("reviewComment")} ({t("optional")})
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("writeReviewPlaceholder")}
              maxLength={1000}
              className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary resize-none"
            />
            <span className="text-[10px] text-muted text-right block mt-1">
              {comment.length} / 1000
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {initialReview ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-danger border-danger/30 hover:bg-danger/10 inline-flex items-center gap-1.5"
              >
                <Trash2 className="size-3.5" />
                <span>{t("deleteReview")}</span>
              </Button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t("loading") : initialReview ? t("save") : t("submit")}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {showDeleteConfirm && (
        <ConfirmDialog
          title={t("deleteReview")}
          message={t("deleteReviewConfirm") || "Are you sure you want to delete this review? This action cannot be undone."}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
