const mongoose = require('mongoose');

const careNoteSchema = new mongoose.Schema(
  {
    noteId: {
      type: String,
      required: true,
      unique: true,
    },
    bookingId: {
      type: String,
      required: [true, 'Booking ID is required'],
      index: true,
    },
    caregiverId: {
      type: String,
      required: [true, 'Caregiver ID is required'],
      index: true,
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
    },
    vitals: {
      bp: { type: String, default: '120/80 mmHg' },
      pulse: { type: String, default: '72 bpm' },
      temperature: { type: String, default: '98.6 °F' },
      sugarLevel: { type: String, default: '110 mg/dL' },
      oxygenLevel: { type: String, default: '98%' },
    },
    tasksPerformed: {
      type: [String],
      default: [],
    },
    observations: {
      type: String,
      default: '',
    },
    attachmentUrls: {
      type: [String],
      default: [],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const inMemoryCareNotes = new Map();

class CareNoteModelAdapter {
  static async find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return await CareNote.find(query).sort({ timestamp: -1 });
    }
    const results = [];
    for (const n of inMemoryCareNotes.values()) {
      let match = true;
      for (const [key, val] of Object.entries(query)) {
        if (n[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) results.push(n);
    }
    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await CareNote.findOne({ noteId: id }) || await CareNote.findById(id);
    }
    return inMemoryCareNotes.get(id) || null;
  }

  static async createCareNote(data) {
    const noteId = data.noteId || `NOTE-${Date.now().toString().slice(-6)}`;
    const noteData = {
      ...data,
      noteId,
      _id: noteId,
      timestamp: data.timestamp || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const n = new CareNote(noteData);
      return await n.save();
    }

    inMemoryCareNotes.set(noteId, noteData);
    return noteData;
  }

  static seedInitialData(careNotesArray) {
    careNotesArray.forEach((n) => inMemoryCareNotes.set(n.noteId, n));
  }
}

const CareNote = mongoose.model('CareNote', careNoteSchema);

module.exports = {
  CareNote,
  CareNoteModelAdapter,
};
