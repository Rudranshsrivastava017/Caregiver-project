const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
    },
    linkedUserId: {
      type: String,
      required: [true, 'Linked user ID is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Patient full name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Patient age is required'],
      min: 0,
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
    },
    medicalHistory: {
      type: String,
      default: '',
    },
    mobilityStatus: {
      type: String,
      enum: ['independent', 'assisted', 'bedridden'],
      default: 'assisted',
    },
    emergencyContactName: {
      type: String,
      required: [true, 'Emergency contact name is required'],
    },
    emergencyContactPhone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
    },
    address: {
      type: String,
      required: [true, 'Care address is required'],
    },
    photoUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
  },
  {
    timestamps: true,
  }
);

const inMemoryPatients = new Map();

class PatientModelAdapter {
  static async find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return await Patient.find(query);
    }
    const results = [];
    for (const p of inMemoryPatients.values()) {
      let match = true;
      for (const [key, val] of Object.entries(query)) {
        if (p[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) results.push(p);
    }
    return results;
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await Patient.findOne({ patientId: id }) || await Patient.findById(id);
    }
    return inMemoryPatients.get(id) || null;
  }

  static async createPatient(data) {
    const patientId = data.patientId || `PT-${Date.now().toString().slice(-6)}`;
    const patientData = {
      ...data,
      patientId,
      _id: patientId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const patient = new Patient(patientData);
      return await patient.save();
    }

    inMemoryPatients.set(patientId, patientData);
    return patientData;
  }

  static async updatePatient(id, updateData) {
    if (mongoose.connection.readyState === 1) {
      return await Patient.findOneAndUpdate(
        { patientId: id },
        { $set: updateData },
        { new: true }
      );
    }

    const patient = inMemoryPatients.get(id);
    if (!patient) return null;
    const updated = { ...patient, ...updateData, updatedAt: new Date() };
    inMemoryPatients.set(id, updated);
    return updated;
  }

  static async deletePatient(id) {
    if (mongoose.connection.readyState === 1) {
      return await Patient.findOneAndDelete({ patientId: id });
    }
    const exists = inMemoryPatients.has(id);
    inMemoryPatients.delete(id);
    return exists;
  }

  static seedInitialData(patientsArray) {
    patientsArray.forEach((p) => inMemoryPatients.set(p.patientId, p));
  }
}

const Patient = mongoose.model('Patient', patientSchema);

module.exports = {
  Patient,
  PatientModelAdapter,
};
