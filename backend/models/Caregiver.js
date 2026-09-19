const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema(
  {
    caregiverId: {
      type: String,
      required: true,
      unique: true,
    },
    linkedUserId: {
      type: String,
      required: [true, 'Linked user ID is required'],
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      enum: ['nurse', 'physiotherapist', 'attendant', 'general_caregiver'],
      required: true,
    },
    qualification: {
      type: String,
      required: true,
    },
    yearsExperience: {
      type: Number,
      required: true,
      default: 1,
    },
    certificationDocsUrl: {
      type: [String],
      default: [],
    },
    availability: {
      type: mongoose.Schema.Types.Mixed,
      default: [
        { day: 'Monday', startTime: '08:00', endTime: '20:00' },
        { day: 'Tuesday', startTime: '08:00', endTime: '20:00' },
        { day: 'Wednesday', startTime: '08:00', endTime: '20:00' },
        { day: 'Thursday', startTime: '08:00', endTime: '20:00' },
        { day: 'Friday', startTime: '08:00', endTime: '20:00' },
        { day: 'Saturday', startTime: '09:00', endTime: '18:00' },
      ],
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    serviceAreas: {
      type: [String],
      default: ['South Delhi', 'Noida', 'Gurugram'],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: '',
    },
    photoUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?auto=format&fit=crop&w=300&q=80',
    },
  },
  {
    timestamps: true,
  }
);

const inMemoryCaregivers = new Map();

class CaregiverModelAdapter {
  static async find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return await Caregiver.find(query);
    }
    const results = [];
    for (const cg of inMemoryCaregivers.values()) {
      let match = true;
      for (const [key, val] of Object.entries(query)) {
        if (cg[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) results.push(cg);
    }
    return results;
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await Caregiver.findOne({ caregiverId: id }) || await Caregiver.findById(id);
    }
    return inMemoryCaregivers.get(id) || null;
  }

  static async findByUserId(userId) {
    if (mongoose.connection.readyState === 1) {
      return await Caregiver.findOne({ linkedUserId: userId });
    }
    for (const cg of inMemoryCaregivers.values()) {
      if (cg.linkedUserId === userId) return cg;
    }
    return null;
  }

  static async createCaregiver(data) {
    const caregiverId = data.caregiverId || `CG-${Date.now().toString().slice(-6)}`;
    const caregiverData = {
      ...data,
      caregiverId,
      _id: caregiverId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const cg = new Caregiver(caregiverData);
      return await cg.save();
    }

    inMemoryCaregivers.set(caregiverId, caregiverData);
    return caregiverData;
  }

  static async updateCaregiver(id, updateData) {
    if (mongoose.connection.readyState === 1) {
      return await Caregiver.findOneAndUpdate(
        { caregiverId: id },
        { $set: updateData },
        { new: true }
      );
    }

    const cg = inMemoryCaregivers.get(id);
    if (!cg) return null;
    const updated = { ...cg, ...updateData, updatedAt: new Date() };
    inMemoryCaregivers.set(id, updated);
    return updated;
  }

  static seedInitialData(caregiversArray) {
    caregiversArray.forEach((cg) => inMemoryCaregivers.set(cg.caregiverId, cg));
  }
}

const Caregiver = mongoose.model('Caregiver', caregiverSchema);

module.exports = {
  Caregiver,
  CaregiverModelAdapter,
};
