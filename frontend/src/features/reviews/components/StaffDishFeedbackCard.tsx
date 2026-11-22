import { useState, useEffect } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";
import Card from "../../../shared/components/ui/Card";
import Modal from "../../../shared/components/ui/Modal";
import StarRating from "./StarRating";
import FoodReviewsList from "./FoodReviewsList";
import { getStaffReviewSummary } from "../api/reviewsApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";
import type { StaffReviewSummary } from "../types";

export default function StaffDishFeedbackCard() {
  const { t } = useTranslation();
  const [data, setData] = useState<StaffReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [inspectFood, setInspectFood] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    getStaffReviewSummary()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  return (
    <>
      <div className="mt-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {t("dishFeedbackTitle") || "Customer Feedback & Quality Insights"}
          </h2>
          <p className="text-xs text-muted">
            Read-only customer reviews to identify top-performing dishes and kitchen quality issues
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Rated Dishes */}
          <Card
            title={t("topRatedDishes") || "Top-Rated Customer Favorites"}
            action={
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3.5" />
                <span>High Quality</span>
              </span>
            }
            className="rounded-2xl shadow-xs"
          >
            {data.topRatedDishes.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No reviews submitted yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {data.topRatedDishes.map((dish) => (
                  <div
                    key={dish.foodId}
                    onClick={() => setInspectFood({ id: dish.foodId, name: dish.foodName })}
                    className="flex items-center justify-between py-2.5 text-xs hover:bg-surface-secondary/40 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{dish.foodName}</span>
                      <span className="text-[11px] text-muted">{dish.reviewCount} reviews</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StarRating value={dish.averageRating} size="sm" showScore />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Lowest Rated Dishes (Quality Alert) */}
          <Card
            title={t("qualityWatchlist") || "Dishes Needing Kitchen Attention"}
            action={
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                <AlertCircle className="size-3.5" />
                <span>Quality Review</span>
              </span>
            }
            className="rounded-2xl shadow-xs"
          >
            {data.lowestRatedDishes.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No reviews submitted yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {data.lowestRatedDishes.map((dish) => (
                  <div
                    key={dish.foodId}
                    onClick={() => setInspectFood({ id: dish.foodId, name: dish.foodName })}
                    className="flex items-center justify-between py-2.5 text-xs hover:bg-surface-secondary/40 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{dish.foodName}</span>
                      <span className="text-[11px] text-muted">{dish.reviewCount} reviews</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StarRating value={dish.averageRating} size="sm" showScore />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Written Customer Comments */}
        {data.recentReviews.length > 0 && (
          <Card
            title={t("recentCustomerFeedback") || "Recent Customer Feedback"}
            className="rounded-2xl shadow-xs"
          >
            <div className="space-y-3">
              {data.recentReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-xl border border-border bg-surface-secondary/30 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{rev.food.name}</span>
                    <span className="text-[10px] text-muted">{formatTimeAgo(rev.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={rev.rating} size="sm" />
                    <span className="text-[11px] text-muted font-medium">by {rev.user.fullName}</span>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap italic">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Read-Only Food Reviews Modal */}
      {inspectFood && (
        <Modal
          open
          onClose={() => setInspectFood(null)}
          title={`Reviews: ${inspectFood.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-muted">
              Staff read-only feedback. Reviews cannot be edited, deleted, or hidden by staff.
            </p>
            <FoodReviewsList foodId={inspectFood.id} foodName={inspectFood.name} />
          </div>
        </Modal>
      )}
    </>
  );
}
