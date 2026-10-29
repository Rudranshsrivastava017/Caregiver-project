const { CareNoteModelAdapter } = require('../models/CareNote');
const { BookingModelAdapter } = require('../models/Booking');
const { CaregiverModelAdapter } = require('../models/Caregiver');
const { PatientModelAdapter } = require('../models/Patient');
const { emitCareNoteAdded } = require('../sockets/index');

/**
 * Clinical Vitals Validation Guard (P1-2)
 * Validates format and physiological ranges for eldercare clinical vitals.
 * Returns null if valid, or an error string if invalid.
 */
const validateClinicalVitals = (vitals) => {
  if (!vitals || typeof vitals !== 'object') {
    return null; // optional or default vitals will be applied
  }

  // 1. Blood Pressure Validation: format 'XXX/YY' or 'XXX/YY mmHg'
  if (vitals.bp) {
    const bpStr = String(vitals.bp).trim();
    const bpMatch = bpStr.match(/^(\d{2,3})\s*\/\s*(\d{2,3})(\s*mmHg)?$/i);
    if (!bpMatch) {
      return 'Blood pressure must be in valid format (e.g., 120/80 or 120/80 mmHg).';
    }
    const systolic = parseInt(bpMatch[1], 10);
    const diastolic = parseInt(bpMatch[2], 10);
    if (systolic < 60 || systolic > 260 || diastolic < 30 || diastolic > 160) {
      return `Blood pressure readings (${systolic}/${diastolic} mmHg) are outside physiological ranges (Systolic: 60-260, Diastolic: 30-160).`;
    }
  }

  // 2. Pulse Validation: 30 to 240 bpm
  if (vitals.pulse !== undefined && vitals.pulse !== null && vitals.pulse !== '') {
    const pulseNum = parseInt(String(vitals.pulse).replace(/\D+/g, ''), 10);
    if (isNaN(pulseNum) || pulseNum < 30 || pulseNum > 240) {
      return 'Pulse must be a valid number between 30 and 240 bpm.';
    }
  }

  // 3. SpO2 (Oxygen Saturation) Validation: 50% to 100%
  if (vitals.oxygenLevel !== undefined && vitals.oxygenLevel !== null && vitals.oxygenLevel !== '') {
    const oxyNum = parseInt(String(vitals.oxygenLevel).replace(/[^\d.]/g, ''), 10);
    if (isNaN(oxyNum) || oxyNum < 50 || oxyNum > 100) {
      return 'Oxygen saturation (SpO2) must be between 50% and 100%.';
    }
  }

  // 4. Body Temperature Validation: 90.0°F to 108.0°F (or 32°C to 42.5°C)
  if (vitals.temperature !== undefined && vitals.temperature !== null && vitals.temperature !== '') {
    const tempStr = String(vitals.temperature);
    const isCelsius = tempStr.includes('C') || tempStr.includes('c');
    const tempNum = parseFloat(tempStr.replace(/[^\d.]/g, ''));
    if (isNaN(tempNum)) {
      return 'Temperature must be a valid numeric measurement (e.g., 98.6 °F).';
    }
    if (isCelsius) {
      if (tempNum < 32.0 || tempNum > 42.5) {
        return 'Body temperature in Celsius must be between 32.0°C and 42.5°C.';
      }
    } else {
      if (tempNum < 90.0 || tempNum > 108.0) {
        return 'Body temperature must be between 90.0°F and 108.0°F.';
      }
    }
  }

  // 5. Blood Sugar Level Validation (optional): 20 to 700 mg/dL
  if (vitals.sugarLevel !== undefined && vitals.sugarLevel !== null && vitals.sugarLevel !== '') {
    const sugarNum = parseInt(String(vitals.sugarLevel).replace(/\D+/g, ''), 10);
    if (isNaN(sugarNum) || sugarNum < 20 || sugarNum > 700) {
      return 'Blood sugar level must be between 20 and 700 mg/dL.';
    }
  }

  return null;
};

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
        error: {
          code: 'INVALID_INPUT',
          message: 'Booking ID is required to log a care note.',
        },
        message: 'Booking ID is required to log a care note.',
      });
    }

    // Input Guard: Validate clinical vitals if provided
    if (vitals) {
      const vitalsError = validateClinicalVitals(vitals);
      if (vitalsError) {
        return res.status(400).json({
          status: 'fail',
          error: {
            code: 'INVALID_INPUT',
            message: vitalsError,
          },
          message: vitalsError,
        });
      }
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
