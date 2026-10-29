import React, { useState } from 'react';
import { Star, X, CheckCircle2, Loader2, HeartHandshake } from 'lucide-react';
import { toast } from 'sonner';
import axiosClient from '../../api/axiosClient';

const RATING_DESCRIPTIONS = {
  1: '1 Star — Needs Improvement',
  2: '2 Stars — Fair Care',
  3: '3 Stars — Good & Satisfactory',
  4: '4 Stars — Very Good Care',
  5: '5 Stars — Outstanding & Compassionate',
};

export default function ReviewModal({ booking, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a star rating between 1 and 5.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingId = booking.bookingId || booking._id || booking.id;
      const response = await axiosClient.post(`/bookings/${bookingId}/review`, {
        rating,
        comment: comment.trim(),
      });

      if (response.data?.status === 'success') {
        toast.success('Thank you! Your verified care review has been recorded.');
        if (typeof onSuccess === 'function') {
          onSuccess(response.data.data);
        }
        onClose();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close review modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h2
            id="review-modal-title"
            className="text-2xl font-extrabold text-slate-900 tracking-tight"
          >
            Rate Your Healthcare Caregiver
          </h2>
          <p className="text-slate-600 text-sm">
            Care provided by{' '}
            <strong className="text-teal-800">
              {booking.caregiverName || 'Assigned Caregiver'}
            </strong>{' '}
            on {booking.scheduledDate} ({booking.scheduledTime || 'Shift'})
          </p>
        </div>

        {/* Rating Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating Selector */}
          <div className="text-center space-y-3">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Select Your Rating
            </label>
            <div
              role="radiogroup"
              aria-label="Star Rating"
              className="flex items-center justify-center gap-2"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} Star${star > 1 ? 's' : ''}`}
                  className="p-1 focus:outline-none focus:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                      star <= activeRating
                        ? 'text-amber-500 fill-amber-400'
                        : 'text-slate-200 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Accessible Description of Selected Rating */}
            <p className="text-sm font-bold text-amber-800 min-h-[1.5rem]">
              {RATING_DESCRIPTIONS[activeRating] || 'Select stars'}
            </p>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-2 text-left">
            <label
              htmlFor="review-comment"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              Feedback & Comments (Optional)
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share how the caregiver assisted your family member (punctuality, gentle assistance, bedside manner, clinical vitals tracking)..."
              className="w-full text-sm bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl p-3.5 outline-none transition-all placeholder:text-slate-400"
              maxLength={1000}
            />
            <div className="text-right text-[11px] text-slate-400">
              {comment.length} / 1000 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="btn-outline px-5 py-2.5 text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
