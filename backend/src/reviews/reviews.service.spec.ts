import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReviewsService } from './reviews.service.js';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: {
    orderItem: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    review: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
      groupBy: ReturnType<typeof vi.fn>;
    };
    food: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  const customerId = 'cust-1';
  const otherCustomerId = 'cust-2';
  const adminId = 'admin-1';
  const foodId = 'food-1';
  const orderId = 'order-1';
  const orderItemId = 'item-1';
  const reviewId = 'rev-1';

  beforeEach(() => {
    prisma = {
      orderItem: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      review: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      },
      food: {
        findMany: vi.fn(),
      },
    };

    service = new ReviewsService(prisma as unknown as PrismaService);
  });

  describe('createReview', () => {
    it('should create a review when order item is from a served order belonging to customer', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: orderItemId,
        orderId,
        foodId,
        order: {
          id: orderId,
          customerId,
          status: OrderStatus.SERVED,
        },
        food: {
          id: foodId,
          name: 'Doro Wot',
        },
        review: null,
      });

      const createdReview = {
        id: reviewId,
        foodId,
        orderId,
        orderItemId,
        userId: customerId,
        rating: 5,
        comment: 'Delicious!',
        isHidden: false,
      };

      prisma.review.create.mockResolvedValue(createdReview);

      const result = await service.createReview(customerId, {
        orderItemId,
        rating: 5,
        comment: 'Delicious!',
      });

      expect(result).toEqual(createdReview);
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: {
          foodId,
          orderId,
          orderItemId,
          userId: customerId,
          rating: 5,
          comment: 'Delicious!',
        },
        include: expect.any(Object),
      });
    });

    it('should allow reviewing picked up and delivered orders', async () => {
      for (const status of [OrderStatus.PICKED_UP, OrderStatus.DELIVERED, OrderStatus.COMPLETED]) {
        prisma.orderItem.findUnique.mockResolvedValue({
          id: orderItemId,
          orderId,
          foodId,
          order: { id: orderId, customerId, status },
          food: { id: foodId, name: 'Tibs' },
          review: null,
        });

        prisma.review.create.mockResolvedValue({ id: 'rev-xyz' });

        await expect(
          service.createReview(customerId, { orderItemId, rating: 4 }),
        ).resolves.toBeDefined();
      }
    });

    it('should throw NotFoundException if order item does not exist', async () => {
      prisma.orderItem.findUnique.mockResolvedValue(null);

      await expect(
        service.createReview(customerId, { orderItemId: 'invalid-id', rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if order belongs to another customer', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: orderItemId,
        orderId,
        foodId,
        order: {
          id: orderId,
          customerId: otherCustomerId,
          status: OrderStatus.DELIVERED,
        },
        food: { id: foodId, name: 'Tibs' },
        review: null,
      });

      await expect(
        service.createReview(customerId, { orderItemId, rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order status is not served, picked up, or delivered (e.g. PENDING)', async () => {
      for (const status of [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ]) {
        prisma.orderItem.findUnique.mockResolvedValue({
          id: orderItemId,
          orderId,
          foodId,
          order: { id: orderId, customerId, status },
          food: { id: foodId, name: 'Shiro' },
          review: null,
        });

        await expect(
          service.createReview(customerId, { orderItemId, rating: 5 }),
        ).rejects.toThrow(BadRequestException);
      }
    });

    it('should throw ConflictException if order item has already been reviewed', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: orderItemId,
        orderId,
        foodId,
        order: { id: orderId, customerId, status: OrderStatus.SERVED },
        food: { id: foodId, name: 'Shiro' },
        review: { id: 'existing-rev' },
      });

      await expect(
        service.createReview(customerId, { orderItemId, rating: 5 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateReview', () => {
    it('should allow customer to update their own review', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId: customerId,
        rating: 4,
        comment: 'Good',
      });

      prisma.review.update.mockResolvedValue({
        id: reviewId,
        userId: customerId,
        rating: 5,
        comment: 'Great update',
      });

      const res = await service.updateReview(customerId, reviewId, {
        rating: 5,
        comment: 'Great update',
      });

      expect(res.rating).toBe(5);
      expect(prisma.review.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if another user tries to update the review', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId: customerId,
      });

      await expect(
        service.updateReview(otherCustomerId, reviewId, { rating: 1 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if review to update does not exist', async () => {
      prisma.review.findUnique.mockResolvedValue(null);

      await expect(
        service.updateReview(customerId, 'non-existent', { rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteReview', () => {
    it('should allow author to delete their own review', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId: customerId,
      });
      prisma.review.delete.mockResolvedValue({ id: reviewId });

      const res = await service.deleteReview({ id: customerId, role: Role.CUSTOMER }, reviewId);
      expect(res.message).toBe('Review deleted successfully');
      expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: reviewId } });
    });

    it('should allow Admin to delete any review', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId: customerId,
      });
      prisma.review.delete.mockResolvedValue({ id: reviewId });

      const res = await service.deleteReview({ id: adminId, role: Role.ADMIN }, reviewId);
      expect(res.message).toBe('Review deleted successfully');
    });

    it('should throw ForbiddenException if another customer or staff attempts to delete review', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId: customerId,
      });

      await expect(
        service.deleteReview({ id: otherCustomerId, role: Role.CUSTOMER }, reviewId),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.deleteReview({ id: 'staff-1', role: Role.STAFF }, reviewId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('moderateReview', () => {
    it('should allow Admin to hide or restore review with audit trail', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: reviewId });
      prisma.review.update.mockResolvedValue({
        id: reviewId,
        isHidden: true,
        moderationReason: 'Inappropriate language',
        moderatedById: adminId,
      });

      const res = await service.moderateReview(adminId, reviewId, {
        isHidden: true,
        moderationReason: 'Inappropriate language',
      });

      expect(res.isHidden).toBe(true);
      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isHidden: true,
            moderationReason: 'Inappropriate language',
            moderatedById: adminId,
          }),
        }),
      );
    });
  });

  describe('getFoodReviews', () => {
    it('should calculate average rating and exclude hidden reviews', async () => {
      prisma.review.findMany.mockResolvedValue([
        { id: '1', rating: 5, comment: 'Awesome', isHidden: false },
        { id: '2', rating: 4, comment: 'Nice', isHidden: false },
      ]);
      prisma.review.count.mockResolvedValue(2);
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } });
      prisma.review.groupBy.mockResolvedValue([
        { rating: 5, _count: { rating: 1 } },
        { rating: 4, _count: { rating: 1 } },
      ]);

      const result = await service.getFoodReviews(foodId, 1, 10);

      expect(result.stats.averageRating).toBe(4.5);
      expect(result.stats.totalReviews).toBe(2);
      expect(result.stats.distribution[5]).toBe(1);
      expect(result.stats.distribution[4]).toBe(1);
      expect(result.reviews).toHaveLength(2);
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { foodId, isHidden: false },
        }),
      );
    });
  });

  describe('getEligibleItemsForUser', () => {
    it('should return items from served/delivered/picked up orders with review status', async () => {
      prisma.orderItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          orderId: 'ord-1',
          foodId: 'food-1',
          food: { name: 'Doro Wot', price: { toNumber: () => 250 }, imagePath: '/doro.jpg' },
          order: { id: 'ord-1', number: 101, status: OrderStatus.DELIVERED, createdAt: new Date() },
          review: null,
        },
        {
          id: 'item-2',
          orderId: 'ord-2',
          foodId: 'food-2',
          food: { name: 'Tibs', price: { toNumber: () => 300 }, imagePath: '/tibs.jpg' },
          order: { id: 'ord-2', number: 102, status: OrderStatus.SERVED, createdAt: new Date() },
          review: { id: 'rev-2', rating: 5 },
        },
      ]);

      const items = await service.getEligibleItemsForUser(customerId);

      expect(items).toHaveLength(2);
      expect(items[0].hasReviewed).toBe(false);
      expect(items[1].hasReviewed).toBe(true);
      expect(items[1].review?.rating).toBe(5);
    });
  });
});
