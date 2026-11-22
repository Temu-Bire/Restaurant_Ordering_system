import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { PublicUser } from '../users/public-user.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ModerateReviewDto } from './dto/moderate-review.dto.js';
import { ReviewQueryDto } from './dto/review-query.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Public: Get non-hidden reviews and rating stats for a food item
   */
  @Public()
  @Get('food/:foodId')
  getFoodReviews(
    @Param('foodId') foodId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.getFoodReviews(foodId, Number(page), Number(limit));
  }

  /**
   * Customer: Get order items eligible to be reviewed
   */
  @Roles(Role.CUSTOMER)
  @Get('eligible-items')
  getEligibleItems(@CurrentUser() user: PublicUser) {
    return this.reviewsService.getEligibleItemsForUser(user.id);
  }

  /**
   * Customer: Get reviews submitted by current user
   */
  @Roles(Role.CUSTOMER)
  @Get('my')
  getMyReviews(
    @CurrentUser() user: PublicUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.getMyReviews(user.id, Number(page), Number(limit));
  }

  /**
   * Customer: Submit a new review for an eligible order item
   */
  @Roles(Role.CUSTOMER)
  @Post()
  createReview(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.id, dto);
  }

  /**
   * Customer: Update rating or comment of own review
   */
  @Roles(Role.CUSTOMER)
  @Patch(':id')
  updateReview(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(user.id, id, dto);
  }

  /**
   * Customer (own review) or Admin: Delete a review
   */
  @Delete(':id')
  deleteReview(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
  ) {
    return this.reviewsService.deleteReview(user, id);
  }

  /**
   * Staff & Admin: View ratings summary and dish feedback
   */
  @Roles(Role.STAFF, Role.ADMIN)
  @Get('summary')
  getStaffSummary() {
    return this.reviewsService.getStaffSummary();
  }

  /**
   * Admin: List all reviews with filters, moderation status, and search
   */
  @Roles(Role.ADMIN)
  @Get('admin')
  getAdminReviews(@Query() query: ReviewQueryDto) {
    return this.reviewsService.getAdminReviews(query);
  }

  /**
   * Admin: Moderate a review (Hide / Restore)
   */
  @Roles(Role.ADMIN)
  @Patch(':id/moderate')
  moderateReview(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderateReview(user.id, id, dto);
  }
}
