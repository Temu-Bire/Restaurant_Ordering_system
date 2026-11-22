import { api } from "../../../lib/apiClient";
import type {
  AdminReviewsResponse,
  EligibleOrderItem,
  FoodReviewsResponse,
  Review,
  StaffReviewSummary,
} from "../types";

export async function getFoodReviews(
  foodId: string,
  page = 1,
  limit = 10
): Promise<FoodReviewsResponse> {
  return api.get<FoodReviewsResponse>(`/reviews/food/${foodId}?page=${page}&limit=${limit}`);
}

export async function getEligibleItems(): Promise<EligibleOrderItem[]> {
  return api.get<EligibleOrderItem[]>("/reviews/eligible-items");
}

export async function getMyReviews(
  page = 1,
  limit = 10
): Promise<{ reviews: Review[]; pagination: any }> {
  return api.get(`/reviews/my?page=${page}&limit=${limit}`);
}

export async function createReview(data: {
  orderItemId: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  return api.post<Review>("/reviews", data);
}

export async function updateReview(
  id: string,
  data: {
    rating?: number;
    comment?: string;
  }
): Promise<Review> {
  return api.patch<Review>(`/reviews/${id}`, data);
}

export async function deleteReview(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/reviews/${id}`);
}

export async function getStaffReviewSummary(): Promise<StaffReviewSummary> {
  return api.get<StaffReviewSummary>("/reviews/summary");
}

export async function getAdminReviews(params: {
  page?: number;
  limit?: number;
  status?: string;
  foodId?: string;
  rating?: number;
  search?: string;
}): Promise<AdminReviewsResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.foodId) searchParams.set("foodId", params.foodId);
  if (params.rating) searchParams.set("rating", String(params.rating));
  if (params.search) searchParams.set("search", params.search);

  const qs = searchParams.toString();
  return api.get<AdminReviewsResponse>(`/reviews/admin${qs ? `?${qs}` : ""}`);
}

export async function moderateReview(
  id: string,
  data: {
    isHidden: boolean;
    moderationReason?: string;
  }
): Promise<Review> {
  return api.patch<Review>(`/reviews/${id}/moderate`, data);
}
