const { CareNoteModelAdapter } = require('../models/CareNote');
const { BookingModelAdapter } = require('../models/Booking');
const { CaregiverModelAdapter } = require('../models/Caregiver');
const { PatientModelAdapter } = require('../models/Patient');
const { emitCareNoteAdded } = require('../sockets/index');

// 1. Create a Care Note for an active shift
const createCareNote = async (req, res, next) => {
  try {
    const {
      bookingId,
      vitals,
      tasksPerformed,
      observations,
      attachmentUrls,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Booking ID is required to log a care note.',
      });
    }

    const booking = await BookingModelAdapter.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking record not found.',
      });
    }

    // Verify caller is the assigned caregiver (or admin)
    if (req.user.role === 'caregiver') {
      const caregiver = await CaregiverModelAdapter.findByUserId(req.user.userId);
      if (!caregiver || caregiver.caregiverId !== booking.caregiverId) {
        return res.status(403).json({
          status: 'fail',
          message: 'You are not authorized to log care notes for this care shift. You must be the assigned caregiver.',
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Only assigned caregivers or administrators can log clinical care notes.',
      });
    }

    const noteId = `NOTE-${Date.now().toString().slice(-6)}`;
    const newNote = await CareNoteModelAdapter.createCareNote({
      noteId,
      bookingId: booking.bookingId || bookingId,
      caregiverId: booking.caregiverId,
      patientId: booking.patientId,
      vitals: vitals || {
        bp: '120/80 mmHg',
        pulse: '72 bpm',
        temperature: '98.6 °F',
        sugarLevel: '110 mg/dL',
        oxygenLevel: '98%',
      },
      tasksPerformed: Array.isArray(tasksPerformed) ? tasksPerformed : [],
      observations: observations || '',
      attachmentUrls: Array.isArray(attachmentUrls) ? attachmentUrls : [],
      timestamp: new Date(),
    });

    // Real-time socket emission to notify the family user
    try {
      emitCareNoteAdded(booking.userId, booking.bookingId || bookingId, newNote.noteId);
    } catch (socketErr) {
      console.warn('[Socket Warning] Failed to emit careNote:added:', socketErr.message);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Care note and vitals logged successfully.',
      data: newNote,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Care Notes for a specific booking
const getCareNotesByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingModelAdapter.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found.',
      });
    }

    // Access control: Assigned caregiver, booking owner (family user), or admin
    let isAuthorized = req.user.role === 'admin';

    if (req.user.role === 'user' && booking.userId === req.user.userId) {
      isAuthorized = true;
    }

    if (req.user.role === 'caregiver') {
      const caregiver = await CaregiverModelAdapter.findByUserId(req.user.userId);
      if (caregiver && caregiver.caregiverId === booking.caregiverId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view clinical notes for this booking.',
      });
    }

    const notes = await CareNoteModelAdapter.find({ bookingId: booking.bookingId || bookingId });

    return res.status(200).json({
      status: 'success',
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Care Notes for a specific patient
const getCareNotesByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await PatientModelAdapter.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient profile not found.',
      });
    }

    // Access control: Linked family member, assigned caregiver with booking, or admin
    let isAuthorized = req.user.role === 'admin';

    if (req.user.role === 'user' && patient.linkedUserId === req.user.userId) {
      isAuthorized = true;
    }

    if (req.user.role === 'caregiver') {
      const caregiver = await CaregiverModelAdapter.findByUserId(req.user.userId);
      if (caregiver) {
        // Verify caregiver has had or has an active booking with this patient
        const bookings = await BookingModelAdapter.find({
          patientId: patient.patientId || patientId,
          caregiverId: caregiver.caregiverId,
        });
        if (bookings && bookings.length > 0) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view clinical care notes for this patient.',
      });
    }

    const notes = await CareNoteModelAdapter.find({ patientId: patient.patientId || patientId });

    return res.status(200).json({
      status: 'success',
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCareNote,
  getCareNotesByBooking,
  getCareNotesByPatient,
};
