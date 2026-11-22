import { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import StarRating from "./StarRating";
import EmptyState from "../../../shared/components/ui/EmptyState";
import { getFoodReviews } from "../api/reviewsApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";
import type { Review, ReviewStats } from "../types";

interface FoodReviewsListProps {
  foodId: string;
  foodName?: string;
}

export default function FoodReviewsList({ foodId }: FoodReviewsListProps) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function loadReviews(pageNum = 1) {
    setLoading(true);
    try {
      const res = await getFoodReviews(foodId, pageNum, 5);
      setReviews(res.reviews);
      setStats(res.stats);
      setTotalPages(res.pagination.totalPages);
      setPage(res.pagination.page);
    } catch (err) {
      console.error("Failed to load food reviews", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews(1);
  }, [foodId]);

  if (loading && reviews.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Score & Distribution Card */}
      <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-border bg-surface-secondary/30 p-4">
        {/* Big Score */}
        <div className="flex flex-col items-center justify-center text-center sm:border-r sm:border-border sm:pr-6 min-w-[120px]">
          <span className="text-3xl font-black text-foreground">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
          </span>
          <StarRating value={stats.averageRating} size="sm" />
          <span className="text-[11px] text-muted mt-1">
            {stats.totalReviews} {stats.totalReviews === 1 ? t("review") : t("reviews")}
          </span>
        </div>

        {/* 5-Star Distribution Bars */}
        <div className="w-full flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats.distribution[stars] ?? 0;
            const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-5 text-right font-semibold text-muted text-[11px] flex items-center justify-end gap-0.5">
                  {stars} <Star className="size-2.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-6 text-[10px] text-muted text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Review Cards */}
      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-6 text-muted" />}
          title={t("noReviewsYet")}
          message={t("beFirstToReview")}
        />
      ) : (
        <div className="space-y-2.5 divide-y divide-border">
          {reviews.map((r) => (
            <div key={r.id} className="pt-3 first:pt-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {r.user.fullName ? r.user.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {r.user.fullName || "Customer"}
                    </span>
                    <span className="text-[10px] text-muted">
                      {formatTimeAgo(r.createdAt)}
                    </span>
                  </div>
                </div>
                <StarRating value={r.rating} size="sm" />
              </div>

              {r.comment && (
                <p className="text-xs text-foreground/90 pl-9 whitespace-pre-wrap leading-relaxed">
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => loadReviews(page - 1)}
            className="rounded-lg border border-border px-3 py-1 font-semibold text-muted hover:text-foreground disabled:opacity-40"
          >
            ← {t("previous")}
          </button>
          <span className="text-muted text-[11px]">
            {t("page")} {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => loadReviews(page + 1)}
            className="rounded-lg border border-border px-3 py-1 font-semibold text-muted hover:text-foreground disabled:opacity-40"
          >
            {t("next")} →
          </button>
        </div>
      )}
    </div>
  );
}
