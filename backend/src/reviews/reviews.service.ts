import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { ModerateReviewDto } from './dto/moderate-review.dto.js';
import { ReviewQueryDto } from './dto/review-query.dto.js';

export const ELIGIBLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.SERVED,
  OrderStatus.PICKED_UP,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
];

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit a review for a purchased and served/picked up/delivered order item
   */
  async createReview(userId: string, dto: CreateReviewDto) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: dto.orderItemId },
      include: {
        order: true,
        food: true,
        review: true,
      },
    });

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    if (orderItem.order.customerId !== userId) {
      throw new ForbiddenException('You can only review items from your own orders');
    }

    if (!ELIGIBLE_ORDER_STATUSES.includes(orderItem.order.status)) {
      throw new BadRequestException(
        'You can only review food items from served, picked up, or delivered orders',
      );
    }

    if (orderItem.review) {
      throw new ConflictException('This order item has already been reviewed');
    }

    try {
      return await this.prisma.review.create({
        data: {
          foodId: orderItem.foodId,
          orderId: orderItem.orderId,
          orderItemId: orderItem.id,
          userId,
          rating: dto.rating,
          comment: dto.comment?.trim() || null,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          food: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('This order item has already been reviewed');
      }
      throw error;
    }
  }

  /**
   * Customer edits their own review
   */
  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own review');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.comment !== undefined && {
          comment: dto.comment.trim() || null,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        food: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Delete a review (Author or Admin)
   */
  async deleteReview(user: { id: string; role: Role }, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (user.role !== Role.ADMIN && review.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Review deleted successfully' };
  }

  /**
   * Admin moderation: hide or restore a review with audit trail
   */
  async moderateReview(adminId: string, reviewId: string, dto: ModerateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        isHidden: dto.isHidden,
        moderationReason: dto.moderationReason?.trim() || null,
        moderatedById: adminId,
        moderatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        moderatedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        food: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get reviews for a food item (Public / Customer / Staff), excluding hidden
   */
  async getFoodReviews(foodId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, totalCount, aggregate, distributionRaw] =
      await Promise.all([
        this.prisma.review.findMany({
          where: { foodId, isHidden: false },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        }),
        this.prisma.review.count({
          where: { foodId, isHidden: false },
        }),
        this.prisma.review.aggregate({
          where: { foodId, isHidden: false },
          _avg: { rating: true },
        }),
        this.prisma.review.groupBy({
          by: ['rating'],
          where: { foodId, isHidden: false },
          _count: { rating: true },
        }),
      ]);

    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const group of distributionRaw) {
      distribution[group.rating] = group._count.rating;
    }

    const averageRating = aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : 0;

    return {
      reviews,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: {
        averageRating,
        totalReviews: totalCount,
        distribution,
      },
    };
  }

  /**
   * Get items eligible for review for the current customer
   */
  async getEligibleItemsForUser(userId: string) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          customerId: userId,
          status: { in: ELIGIBLE_ORDER_STATUSES },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
      include: {
        order: {
          select: {
            id: true,
            number: true,
            status: true,
            createdAt: true,
          },
        },
        food: {
          select: {
            id: true,
            name: true,
            imagePath: true,
            price: true,
          },
        },
        review: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return orderItems.map((item) => ({
      orderItemId: item.id,
      orderId: item.orderId,
      orderNumber: item.order.number,
      orderStatus: item.order.status,
      orderDate: item.order.createdAt,
      foodId: item.foodId,
      foodName: item.food.name,
      foodPrice: item.food.price.toNumber(),
      foodImagePath: item.food.imagePath,
      hasReviewed: Boolean(item.review),
      review: item.review,
    }));
  }

  /**
   * Get reviews created by current user
   */
  async getMyReviews(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          food: {
            select: {
              id: true,
              name: true,
              imagePath: true,
            },
          },
          order: {
            select: {
              id: true,
              number: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where: { userId } }),
    ]);

    return {
      reviews,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  /**
   * Admin view of all reviews with filtering, moderation status, and metrics
   */
  async getAdminReviews(query: ReviewQueryDto) {
    const { page = 1, limit = 10, status = 'all', foodId, rating, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === 'visible') {
      where.isHidden = false;
    } else if (status === 'hidden') {
      where.isHidden = true;
    }

    if (foodId) {
      where.foodId = foodId;
    }

    if (rating) {
      where.rating = rating;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { comment: { contains: q, mode: 'insensitive' } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { food: { name: { contains: q, mode: 'insensitive' } } },
        { moderationReason: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [reviews, totalCount, statsRaw, hiddenCount] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          food: {
            select: {
              id: true,
              name: true,
            },
          },
          order: {
            select: {
              id: true,
              number: true,
            },
          },
          moderatedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where: { isHidden: false },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.review.count({
        where: { isHidden: true },
      }),
    ]);

    return {
      reviews,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: {
        averageRating: statsRaw._avg.rating
          ? Math.round(statsRaw._avg.rating * 10) / 10
          : 0,
        visibleReviewsCount: statsRaw._count.rating,
        hiddenReviewsCount: hiddenCount,
        totalReviewsCount: statsRaw._count.rating + hiddenCount,
      },
    };
  }

  /**
   * Get ratings summary for staff and admin
   */
  async getStaffSummary() {
    const [overall, foodStats, recentReviews] = await Promise.all([
      this.prisma.review.aggregate({
        where: { isHidden: false },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['foodId'],
        where: { isHidden: false },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.review.findMany({
        where: { isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          food: { select: { id: true, name: true } },
          user: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    const foods = await this.prisma.food.findMany({
      where: { id: { in: foodStats.map((f) => f.foodId) } },
      select: { id: true, name: true },
    });
    const foodNameMap = new Map(foods.map((f) => [f.id, f.name]));

    const dishesRanked = foodStats
      .map((f) => ({
        foodId: f.foodId,
        foodName: foodNameMap.get(f.foodId) ?? 'Dish',
        averageRating: f._avg.rating
          ? Math.round(f._avg.rating * 10) / 10
          : 0,
        reviewCount: f._count.rating,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    return {
      averageRating: overall._avg.rating
        ? Math.round(overall._avg.rating * 10) / 10
        : 0,
      totalReviews: overall._count.rating,
      topRatedDishes: dishesRanked.slice(0, 5),
      lowestRatedDishes: [...dishesRanked].reverse().slice(0, 5),
      recentReviews,
    };
  }
}
