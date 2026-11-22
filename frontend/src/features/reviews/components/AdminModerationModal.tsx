import { useState } from "react";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import Modal from "../../../shared/components/ui/Modal";
import Button from "../../../shared/components/ui/Button";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { moderateReview } from "../api/reviewsApi";
import type { Review } from "../types";

interface AdminModerationModalProps {
  review: Review | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AdminModerationModal({
  review,
  onClose,
  onSaved,
}: AdminModerationModalProps) {
  const { t } = useTranslation();
  const [isHidden, setIsHidden] = useState<boolean>(review?.isHidden ?? true);
  const [reason, setReason] = useState<string>(review?.moderationReason ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!review) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await moderateReview(review!.id, {
        isHidden,
        moderationReason: reason.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to moderate review");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={t("moderateReview") || "Moderate Review"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-danger">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Review preview */}
        <div className="rounded-2xl border border-border bg-surface-secondary/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">{review.user.fullName}</span>
            <span className="text-amber-500 font-bold">★ {review.rating}</span>
          </div>
          {review.comment ? (
            <p className="text-xs text-muted italic">"{review.comment}"</p>
          ) : (
            <p className="text-xs text-muted italic">(No comment)</p>
          )}
          {review.food && (
            <p className="text-[11px] text-muted">
              Dish: <strong className="text-foreground">{review.food.name}</strong>
            </p>
          )}
        </div>

        {/* Action Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted block">
            {t("moderationAction") || "Moderation Status"}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsHidden(false)}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                !isHidden
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-surface text-muted hover:border-emerald-500/40"
              }`}
            >
              <Eye className="size-4" />
              <span>{t("visible") || "Visible to Public"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHidden(true)}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                isHidden
                  ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "border-border bg-surface text-muted hover:border-rose-500/40"
              }`}
            >
              <EyeOff className="size-4" />
              <span>{t("hidden") || "Hide from Public"}</span>
            </button>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="text-xs font-bold text-muted block mb-1.5">
            {t("moderationReason") || "Moderation Reason / Note"}
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Inappropriate language or spam"
            maxLength={500}
            className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t("loading") : t("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
