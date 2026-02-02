'use client';

import { useState } from 'react';
import { Review, ReviewSummary, CreateReviewDTO } from '@/lib/services/product-api';
import { cn } from '@/lib/utils';
import { Star, ThumbsUp, ThumbsDown, User, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ProductReviewsProps {
  reviews: Review[];
  summary: ReviewSummary;
  productId: string;
  onSubmitReview: (data: CreateReviewDTO) => Promise<void>;
  onMarkHelpful: (reviewId: string, isHelpful: boolean) => Promise<void>;
  className?: string;
}

function StarRating({ rating, max = 5, size = 'sm' }: { rating: number; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClasses[size],
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
}

export function ProductReviews({
  reviews,
  summary,
  productId,
  onSubmitReview,
  onMarkHelpful,
  className,
}: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmitReview({ rating, title, content });
      setShowForm(false);
      setRating(0);
      setTitle('');
      setContent('');
    } catch (err) {
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>

      {/* Rating Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-gray-900">
            {summary.averageRating.toFixed(1)}
          </div>
          <div>
            <StarRating rating={Math.round(summary.averageRating)} size="md" />
            <p className="text-sm text-gray-500 mt-1">
              Based on {reviews.length} reviews
            </p>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.ratingBreakdown[star] || 0;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-gray-600">{star} ★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full py-2 px-4 border-2 border-gray-300 rounded-lg font-medium hover:border-gray-400 transition-colors"
      >
        {showForm ? 'Cancel Review' : 'Write a Review'}
      </button>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'w-6 h-6 transition-colors',
                      (hoverRating ? star <= hoverRating : star <= rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Review
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border-b pb-4 last:border-b-0"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {review.user?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(review.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {review.isVerified && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Verified Purchase
                  </span>
                )}
              </div>

              <StarRating rating={review.rating} />

              {review.title && (
                <h4 className="font-medium text-gray-900 mt-2">{review.title}</h4>
              )}

              <p className="text-gray-700 mt-2">{review.content}</p>

              {/* Helpful buttons */}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-gray-500">
                  Helpful?
                </span>
                <button
                  onClick={() => onMarkHelpful(review.id, true)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Yes ({review.helpfulCount})
                </button>
                <button
                  onClick={() => onMarkHelpful(review.id, false)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
                >
                  <ThumbsDown className="w-4 h-4" />
                  No
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
