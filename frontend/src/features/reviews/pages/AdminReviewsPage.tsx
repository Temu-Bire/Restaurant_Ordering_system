import { useState, useEffect } from "react";
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  ShieldAlert,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import PageHeader from "../../../shared/components/layout/PageHeader";
import Card from "../../../shared/components/ui/Card";
import StatCard from "../../../shared/components/ui/StatCard";
import FilterTabs from "../../../shared/components/ui/FilterTabs";
import Badge from "../../../shared/components/ui/Badge";
import Select from "../../../shared/components/ui/Select";
import ConfirmDialog from "../../../shared/components/ui/ConfirmDialog";
import StarRating from "../components/StarRating";
import AdminModerationModal from "../components/AdminModerationModal";
import { getAdminReviews, deleteReview } from "../api/reviewsApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatDate } from "../../../shared/utils/formatDate";
import type { Review } from "../types";

export default function AdminReviewsPage() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    visibleReviewsCount: 0,
    hiddenReviewsCount: 0,
    totalReviewsCount: 0,
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [moderatingReview, setModeratingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [notice, setNotice] = useState("");

  async function loadData(pageNum = page) {
    setLoading(true);
    try {
      const res = await getAdminReviews({
        page: pageNum,
        limit: 10,
        status: statusFilter,
        rating: ratingFilter !== "all" ? Number(ratingFilter) : undefined,
        search: search.trim() || undefined,
      });

      setReviews(res.reviews);
      setStats(res.stats);
      setTotalPages(res.pagination.totalPages);
      setPage(res.pagination.page);
    } catch (err) {
      console.error("Failed to load admin reviews", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData(1);
  }, [statusFilter, ratingFilter, search]);

  async function handleConfirmDelete() {
    if (!deletingReview) return;
    try {
      await deleteReview(deletingReview.id);
      setNotice(t("reviewDeleted") || "Review deleted successfully.");
      setDeletingReview(null);
      await loadData();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      console.error("Failed to delete review", err);
      setDeletingReview(null);
    }
  }

  return (
    <>
      <PageHeader
        title={t("navReviews") || "Customer Reviews"}
        description="Audit, monitor, and moderate food ratings and written feedback across the restaurant"
        search={{ value: search, onChange: setSearch }}
      />

      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-semibold text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("averageRating") || "Average Rating"}
          value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
          icon={<Star className="size-6" />}
          tone="primary"
        />
        <StatCard
          label={t("totalReviews") || "Total Reviews"}
          value={stats.totalReviewsCount}
          icon={<MessageSquare className="size-6" />}
          tone="info"
        />
        <StatCard
          label={t("visibleReviews") || "Visible Reviews"}
          value={stats.visibleReviewsCount}
          icon={<Eye className="size-6" />}
          tone="success"
        />
        <StatCard
          label={t("hiddenReviews") || "Hidden Reviews"}
          value={stats.hiddenReviewsCount}
          icon={<ShieldAlert className="size-6" />}
          tone={stats.hiddenReviewsCount > 0 ? "danger" : undefined}
        />
      </div>

      {/* Filter and Search Controls */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as any)}
          tabs={[
            { value: "all", label: "All Reviews" },
            { value: "visible", label: "Visible" },
            { value: "hidden", label: "Hidden / Flagged" },
          ]}
        />

        <div className="w-44">
          <Select
            id="rating-filter"
            value={ratingFilter}
            options={[
              { value: "all", label: "All Star Ratings" },
              { value: "5", label: "5 Stars Only" },
              { value: "4", label: "4 Stars Only" },
              { value: "3", label: "3 Stars Only" },
              { value: "2", label: "2 Stars Only" },
              { value: "1", label: "1 Star Only" },
            ]}
            onChange={(e) => setRatingFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Reviews Table */}
      <Card className="rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <p className="py-12 text-center text-xs text-muted">{t("loading")}</p>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">
            <p className="text-sm font-semibold">{t("noReviewsFound") || "No reviews found."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-secondary/60 text-muted font-bold">
                <tr>
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Comment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">
                      {r.food?.name ?? "Dish"}
                      {r.order?.number && (
                        <span className="block text-[10px] text-muted font-normal">
                          Order #{r.order.number}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground block">
                        {r.user.fullName}
                      </span>
                      {r.user.email && (
                        <span className="text-[10px] text-muted block truncate max-w-[140px]">
                          {r.user.email}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StarRating value={r.rating} size="sm" showScore />
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {r.comment ? (
                        <p className="line-clamp-2 text-foreground/90">{r.comment}</p>
                      ) : (
                        <span className="text-muted italic">(No written comment)</span>
                      )}
                      {r.isHidden && r.moderationReason && (
                        <p className="text-[10px] text-danger mt-0.5 font-medium">
                          Flag: {r.moderationReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {r.isHidden ? (
                        <Badge variant="disabled" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                          Hidden
                        </Badge>
                      ) : (
                        <Badge variant="active" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          Visible
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setModeratingReview(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-primary hover:bg-surface-secondary transition-colors"
                          title="Moderate Visibility"
                        >
                          {r.isHidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                          <span>{r.isHidden ? "Restore" : "Moderate"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingReview(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/10 hover:border-danger/30 transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border text-xs">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => loadData(page - 1)}
              className="rounded-lg border border-border px-3 py-1 font-semibold text-muted hover:text-foreground disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-muted text-[11px]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => loadData(page + 1)}
              className="rounded-lg border border-border px-3 py-1 font-semibold text-muted hover:text-foreground disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </Card>

      {/* Moderation Modal */}
      {moderatingReview && (
        <AdminModerationModal
          review={moderatingReview}
          onClose={() => setModeratingReview(null)}
          onSaved={() => {
            setNotice("Review moderation status updated.");
            loadData();
            setTimeout(() => setNotice(""), 3000);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingReview && (
        <ConfirmDialog
          title="Delete Review"
          message={`Are you sure you want to permanently delete this review from ${deletingReview.user.fullName}? This cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingReview(null)}
        />
      )}
    </>
  );
}
