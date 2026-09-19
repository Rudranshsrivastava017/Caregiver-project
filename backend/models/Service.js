const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    serviceId: {
      type: String,
      required: true,
      unique: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    durationOptions: {
      type: [String],
      default: ['4 Hours', '8 Hours', '12 Hours (Day/Night)', '24 Hours (Live-in)'],
    },
    price: {
      type: Number,
      required: true,
    },
    requiredQualification: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['medical', 'non_medical', 'rehabilitation'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const inMemoryServices = new Map();

class ServiceModelAdapter {
  static async find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return await Service.find(query);
    }
    const results = [];
    for (const s of inMemoryServices.values()) {
      let match = true;
      for (const [key, val] of Object.entries(query)) {
        if (s[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) results.push(s);
    }
    return results;
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await Service.findOne({ serviceId: id }) || await Service.findById(id);
    }
    return inMemoryServices.get(id) || null;
  }

  static async createService(data) {
    const serviceId = data.serviceId || `SRV-${Date.now().toString().slice(-6)}`;
    const serviceData = {
      ...data,
      serviceId,
      _id: serviceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const s = new Service(serviceData);
      return await s.save();
    }

    inMemoryServices.set(serviceId, serviceData);
    return serviceData;
  }

  static seedInitialData(servicesArray) {
    servicesArray.forEach((s) => inMemoryServices.set(s.serviceId, s));
  }
}

const Service = mongoose.model('Service', serviceSchema);

module.exports = {
  Service,
  ServiceModelAdapter,
};
