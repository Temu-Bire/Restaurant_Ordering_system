export interface ReviewUser {
  id: string;
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface ReviewFood {
  id: string;
  name: string;
  imagePath?: string | null;
}

export interface ReviewOrder {
  id: string;
  number: number;
  createdAt?: string;
}

export interface Review {
  id: string;
  foodId: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  rating: number; // 1 to 5
  comment: string | null;
  isHidden: boolean;
  moderationReason: string | null;
  moderatedById: string | null;
  moderatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  food?: ReviewFood;
  order?: ReviewOrder;
  moderatedBy?: {
    id: string;
    fullName: string;
  } | null;
}

export interface EligibleOrderItem {
  orderItemId: string;
  orderId: string;
  orderNumber: number;
  orderStatus: string;
  orderDate: string;
  foodId: string;
  foodName: string;
  foodPrice: number;
  foodImagePath: string | null;
  hasReviewed: boolean;
  review?: Review | null;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FoodReviewsResponse {
  reviews: Review[];
  pagination: Pagination;
  stats: ReviewStats;
}

export interface AdminReviewsResponse {
  reviews: Review[];
  pagination: Pagination;
  stats: {
    averageRating: number;
    visibleReviewsCount: number;
    hiddenReviewsCount: number;
    totalReviewsCount: number;
  };
}

export interface StaffReviewSummary {
  averageRating: number;
  totalReviews: number;
  topRatedDishes: {
    foodId: string;
    foodName: string;
    averageRating: number;
    reviewCount: number;
  }[];
  lowestRatedDishes: {
    foodId: string;
    foodName: string;
    averageRating: number;
    reviewCount: number;
  }[];
  recentReviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    food: { id: string; name: string };
    user: { id: string; fullName: string };
  }[];
}
