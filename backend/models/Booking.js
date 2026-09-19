const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
    },
    caregiverId: {
      type: String,
      required: [true, 'Caregiver ID is required'],
      index: true,
    },
    serviceId: {
      type: String,
      required: [true, 'Service ID is required'],
    },
    scheduledDate: {
      type: String,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
      default: '8 Hours',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      // Note: Display estimate only per Section 0 and Section 7 of specification
    },
  },
  {
    timestamps: true,
  }
);

const inMemoryBookings = new Map();

class BookingModelAdapter {
  static async find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return await Booking.find(query).sort({ createdAt: -1 });
    }
    const results = [];
    for (const b of inMemoryBookings.values()) {
      let match = true;
      for (const [key, val] of Object.entries(query)) {
        if (b[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) results.push(b);
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await Booking.findOne({ bookingId: id }) || await Booking.findById(id);
    }
    return inMemoryBookings.get(id) || null;
  }

  static async createBooking(data) {
    const bookingId = data.bookingId || `BK-${Date.now().toString().slice(-6)}`;
    const bookingData = {
      ...data,
      bookingId,
      _id: bookingId,
      status: data.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const b = new Booking(bookingData);
      return await b.save();
    }

    inMemoryBookings.set(bookingId, bookingData);
    return bookingData;
  }

  static async updateBookingStatus(id, newStatus) {
    if (mongoose.connection.readyState === 1) {
      return await Booking.findOneAndUpdate(
        { bookingId: id },
        { $set: { status: newStatus } },
        { new: true }
      );
    }

    const b = inMemoryBookings.get(id);
    if (!b) return null;
    b.status = newStatus;
    b.updatedAt = new Date();
    inMemoryBookings.set(id, b);
    return b;
  }

  static seedInitialData(bookingsArray) {
    bookingsArray.forEach((b) => inMemoryBookings.set(b.bookingId, b));
  }
}

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = {
  Booking,
  BookingModelAdapter,
};
