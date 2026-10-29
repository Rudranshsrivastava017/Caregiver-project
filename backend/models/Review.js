const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewId: {
      type: String,
      required: true,
      unique: true,
    },
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    caregiverId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      default: 'Family Member',
    },
    userPhoto: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
    serviceName: {
      type: String,
      default: 'Healthcare Service',
    },
  },
  {
    timestamps: true,
  }
);

const inMemoryReviews = new Map();

class ReviewModelAdapter {
  static async find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return await Review.find(query).sort({ createdAt: -1 });
    }
    const results = [];
    for (const r of inMemoryReviews.values()) {
      let match = true;
      for (const [key, val] of Object.entries(query)) {
        if (r[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) results.push(r);
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return (await Review.findOne({ reviewId: id })) || (await Review.findById(id));
    }
    return inMemoryReviews.get(id) || null;
  }

  static async findByBookingId(bookingId) {
    if (mongoose.connection.readyState === 1) {
      return await Review.findOne({ bookingId });
    }
    for (const r of inMemoryReviews.values()) {
      if (r.bookingId === bookingId) return r;
    }
    return null;
  }

  static async findByCaregiverId(caregiverId) {
    if (mongoose.connection.readyState === 1) {
      return await Review.find({ caregiverId }).sort({ createdAt: -1 });
    }
    const results = [];
    for (const r of inMemoryReviews.values()) {
      if (r.caregiverId === caregiverId) results.push(r);
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async createReview(data) {
    const reviewId = data.reviewId || `REV-${Date.now().toString().slice(-6)}`;
    const reviewData = {
      ...data,
      reviewId,
      _id: reviewId,
      rating: Number(data.rating) || 5,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const review = new Review(reviewData);
      return await review.save();
    }

    inMemoryReviews.set(reviewId, reviewData);
    return reviewData;
  }

  static seedInitialData(reviewsArray) {
    reviewsArray.forEach((r) => inMemoryReviews.set(r.reviewId, r));
  }
}

const Review = mongoose.model('Review', reviewSchema);

module.exports = {
  Review,
  ReviewModelAdapter,
};
