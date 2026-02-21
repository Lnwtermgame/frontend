"use client";

import { useState } from "react";
import {
  Review,
  ReviewSummary,
  CreateReviewDTO,
} from "@/lib/services/product-api";
import { cn } from "@/lib/utils";
import { Star, ThumbsUp, ThumbsDown, User, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface ProductReviewsProps {
  reviews: Review[];
  summary: ReviewSummary;
  productId: string;
  onSubmitReview: (data: CreateReviewDTO) => Promise<void>;
  onMarkHelpful: (reviewId: string, isHelpful: boolean) => Promise<void>;
  className?: string;
}

function StarRating({
  rating,
  max = 5,
  size = "sm",
}: {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClasses[size],
            i < rating ? "fill-brutal-yellow text-black" : "text-gray-300",
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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmitReview({ rating, title, content });
      setShowForm(false);
      setRating(0);
      setTitle("");
      setContent("");
    } catch (err) {
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg bg-brutal-yellow border-[2px] border-black flex items-center justify-center"
          style={{ boxShadow: "2px 2px 0 0 #000000" }}
        >
          <Star className="w-4 h-4 text-black" />
        </div>
        <h3 className="text-lg font-bold text-black thai-font">
          รีวิวจากลูกค้า
        </h3>
      </div>

      {/* Rating Summary */}
      <div
        className="bg-brutal-gray border-[2px] border-black rounded-xl p-6 space-y-4"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl font-black text-black">
            {summary.averageRating.toFixed(1)}
          </div>
          <div>
            <StarRating rating={Math.round(summary.averageRating)} size="md" />
            <p className="text-sm text-gray-500 mt-1 font-medium">
              จาก {reviews.length} รีวิว
            </p>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.ratingBreakdown[star] || 0;
            const percentage =
              reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-gray-600 font-bold">{star} ★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                  <div
                    className="h-full bg-brutal-yellow"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-500 font-bold">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full py-3 px-4 border-[3px] border-black rounded-xl font-bold hover:bg-brutal-yellow transition-colors thai-font bg-white"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        {showForm ? "ยกเลิก" : "เขียนรีวิว"}
      </button>

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white border-[3px] border-black rounded-xl p-6"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          {error && (
            <div className="p-3 bg-brutal-pink/10 text-brutal-pink border-[2px] border-brutal-pink rounded-lg text-sm font-bold thai-font">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-black mb-2 thai-font">
              ให้คะแนน
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Rate ${star} stars`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      (hoverRating ? star <= hoverRating : star <= rating)
                        ? "fill-brutal-yellow text-black"
                        : "text-gray-300",
                    )}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-1 thai-font">
              หัวข้อ (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="สรุปประสบการณ์ของคุณ"
              className="w-full px-4 py-3 border-[2px] border-gray-300 rounded-xl focus:border-black focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-1 thai-font">
              รีวิวของคุณ
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="แชร์ประสบการณ์ของคุณกับสินค้านี้..."
              rows={4}
              required
              aria-label="Your review"
              className="w-full px-4 py-3 border-[2px] border-gray-300 rounded-xl focus:border-black focus:outline-none transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-[3px] border-black thai-font"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            {isSubmitting ? "กำลังส่ง..." : "ส่งรีวิว"}
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8 thai-font font-medium">
            ยังไม่มีรีวิว เป็นคนแรกที่รีวิวสินค้านี้!
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border-b-[2px] border-gray-200 pb-4 last:border-b-0"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 bg-brutal-yellow border-[2px] border-black rounded-lg flex items-center justify-center"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <User className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="font-bold text-black">
                      {review.user?.username || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(review.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {review.isVerified && (
                  <span className="flex items-center gap-1 text-xs text-brutal-green font-bold thai-font">
                    <CheckCircle className="w-3 h-3" />
                    ซื้อแล้ว
                  </span>
                )}
              </div>

              <StarRating rating={review.rating} />

              {review.title && (
                <h4 className="font-bold text-black mt-2">{review.title}</h4>
              )}

              <p className="text-gray-700 mt-2">{review.content}</p>

              {/* Helpful buttons */}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-gray-500 font-bold thai-font">
                  มีประโยชน์?
                </span>
                <button
                  type="button"
                  onClick={() => onMarkHelpful(review.id, true)}
                  aria-label="Mark review as helpful"
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-brutal-pink font-bold transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" aria-hidden="true" />
                  ใช่ ({review.helpfulCount})
                </button>
                <button
                  type="button"
                  onClick={() => onMarkHelpful(review.id, false)}
                  aria-label="Mark review as not helpful"
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-brutal-pink font-bold transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" aria-hidden="true" />
                  ไม่
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
