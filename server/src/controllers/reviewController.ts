import { Request, Response } from 'express';
import Review from '../models/Review.js';
import Restaurant from '../models/Restaurant.js';
import { findRestaurantBySlug, getOrCreateRestaurant } from '../utils/restaurant.js';
import { AuthRequest } from '../middleware/auth.js';

export const submitReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, rating, comment, tags, slug } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
      return;
    }

    const restaurant = await findRestaurantBySlug(slug);
    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    const review = new Review({
      restaurantId: restaurant._id,
      name: name?.trim() || 'Happy Guest',
      rating: Math.round(numRating),
      comment: comment?.trim() || '',
      tags: Array.isArray(tags) ? tags : [],
      isApproved: true,
    });

    await review.save();

    // Recalculate average rating
    const allReviews = await Review.find({ restaurantId: restaurant._id, isApproved: true });
    if (allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      restaurant.googleRating = Number(avg.toFixed(1));
      await restaurant.save();
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your rating and review!',
      data: {
        review,
        newAverage: restaurant.googleRating,
        totalReviews: allReviews.length,
      },
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
};

export const getPublicReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const restaurant = await findRestaurantBySlug(slug);

    const reviews = await Review.find({ restaurantId: restaurant._id, isApproved: true })
      .sort({ createdAt: -1 })
      .limit(30);

    const total = await Review.countDocuments({ restaurantId: restaurant._id, isApproved: true });
    const allReviews = await Review.find({ restaurantId: restaurant._id, isApproved: true });

    const avg = allReviews.length > 0
      ? Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1))
      : 4.9;

    // Star breakdown
    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating]++;
      }
    });

    res.json({
      success: true,
      data: {
        reviews,
        total,
        averageRating: avg,
        breakdown,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};

export const getAdminReviews = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurant = await getOrCreateRestaurant();
    const reviews = await Review.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 });
    const total = reviews.length;
    const avg = total > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1))
      : 5.0;

    res.json({
      success: true,
      data: {
        reviews,
        total,
        averageRating: avg,
      },
    });
  } catch (error) {
    console.error('Get admin reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin reviews' });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Review.findByIdAndDelete(id);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
};
