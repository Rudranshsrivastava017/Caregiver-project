const { BookingModelAdapter } = require('../models/Booking');
const { PatientModelAdapter } = require('../models/Patient');
const { CaregiverModelAdapter } = require('../models/Caregiver');
const { ServiceModelAdapter } = require('../models/Service');
const { UserModelAdapter } = require('../models/User');

// Helper: Check if two scheduled time slots conflict on the same date
const isSlotOverlapping = (slotA, slotB) => {
  if (!slotA || !slotB) return false;
  // Exact match
  if (slotA.trim().toLowerCase() === slotB.trim().toLowerCase()) return true;

  // 24-Hour full-day shift conflicts with any other shift on the same day
  if (slotA.includes('24 Hour') || slotB.includes('24 Hour')) return true;

  // Day shift (08:00 AM - 08:00 PM) overlaps with Morning, Afternoon, and Evening
  if (slotA.includes('Day Shift') || slotB.includes('Day Shift')) {
    const other = slotA.includes('Day Shift') ? slotB : slotA;
    if (
      other.includes('Morning') ||
      other.includes('Afternoon') ||
      other.includes('Evening') ||
      other.includes('Day Shift')
    ) {
      return true;
    }
  }

  return false;
};

// Helper: Enrich booking record with patient, caregiver, service, and user data
const enrichBooking = async (booking) => {
  const b = typeof booking.toObject === 'function' ? booking.toObject() : { ...booking };

  const [patient, caregiver, service, user] = await Promise.all([
    PatientModelAdapter.findById(b.patientId),
    CaregiverModelAdapter.findById(b.caregiverId),
    ServiceModelAdapter.findById(b.serviceId),
    UserModelAdapter.findById(b.userId),
  ]);

  return {
    ...b,
    patientName: patient?.fullName || 'Elderly Patient',
    patientAge: patient?.age || null,
    patientGender: patient?.gender || null,
    patientMobility: patient?.mobilityStatus || 'assisted',
    patientAddress: patient?.address || '',
    patientEmergencyContact: patient?.emergencyContactName || '',
    patientEmergencyPhone: patient?.emergencyContactPhone || '',
    patientPhoto: patient?.photoUrl || null,
    patientMedicalHistory: patient?.medicalHistory || '',

    caregiverName: caregiver?.fullName || 'Assigned Caregiver',
    caregiverPhoto: caregiver?.photoUrl || null,
    caregiverQualification: caregiver?.qualification || '',
    caregiverSpecialization: caregiver?.specialization || 'nurse',
    caregiverRating: caregiver?.rating || 5.0,
    caregiverVerified: caregiver?.verified || false,

    serviceName: service?.serviceName || 'Healthcare Service',
    serviceCategory: service?.category || 'medical',
    servicePrice: service?.price || b.totalPrice,

    bookerName: user?.fullName || 'Family Member',
    bookerPhone: user?.phone || '',
    bookerEmail: user?.email || '',
  };
};

// 1. Create a new booking with strict conflict prevention
const createBooking = async (req, res, next) => {
  try {
    const {
      patientId,
      caregiverId,
      serviceId,
      scheduledDate,
      scheduledTime,
      duration,
    } = req.body;

    // Validate required fields
    if (!patientId || !caregiverId || !serviceId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide patientId, caregiverId, serviceId, scheduledDate, and scheduledTime.',
      });
    }

    // 1. Security Check: Patient must belong to the logged-in family user
    const patient = await PatientModelAdapter.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient profile not found.',
      });
    }

    if (patient.linkedUserId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Security error: You can only book services for your own registered family members.',
      });
    }

    // 2. Verify Caregiver exists and is approved
    const caregiver = await CaregiverModelAdapter.findById(caregiverId);
    if (!caregiver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Caregiver profile not found.',
      });
    }

    if (!caregiver.verified) {
      return res.status(400).json({
        status: 'fail',
        message: 'This caregiver is currently awaiting administrative credential verification.',
      });
    }

    // 3. Verify Service exists & get display price estimate
    const service = await ServiceModelAdapter.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Selected healthcare service not found.',
      });
    }

    // 4. Double-Booking & Time-Slot Conflict Check
    // Query active bookings for this caregiver on the same scheduledDate
    const existingBookings = await BookingModelAdapter.find({
      caregiverId: caregiver.caregiverId || caregiverId,
      scheduledDate,
    });

    const activeBookings = existingBookings.filter((b) =>
      ['pending', 'confirmed', 'in_progress'].includes(b.status)
    );

    const conflictingBooking = activeBookings.find((b) =>
      isSlotOverlapping(b.scheduledTime, scheduledTime)
    );

    if (conflictingBooking) {
      return res.status(409).json({
        status: 'fail',
        code: 'SLOT_ALREADY_BOOKED',
        message: `This caregiver is already booked on ${scheduledDate} for ${conflictingBooking.scheduledTime}. Please select another time slot or choose another verified caregiver.`,
        conflictingBooking: {
          bookingId: conflictingBooking.bookingId,
          scheduledDate: conflictingBooking.scheduledDate,
          scheduledTime: conflictingBooking.scheduledTime,
          duration: conflictingBooking.duration,
          status: conflictingBooking.status,
        },
      });
    }

    // 5. Create Booking Record
    const bookingId = `BK-${Date.now().toString().slice(-6)}`;
    const newBooking = await BookingModelAdapter.createBooking({
      bookingId,
      userId: req.user.userId,
      patientId: patient.patientId || patientId,
      caregiverId: caregiver.caregiverId || caregiverId,
      serviceId: service.serviceId || serviceId,
      scheduledDate,
      scheduledTime,
      duration: duration || '4 Hours',
      status: 'pending',
      totalPrice: service.price || 0, // Informational display estimate only
    });

    const enriched = await enrichBooking(newBooking);

    return res.status(201).json({
      status: 'success',
      message: 'Care shift booking request sent successfully.',
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Check caregiver availability & booked time slots for a given date
const checkCaregiverAvailability = async (req, res, next) => {
  try {
    const { caregiverId, date } = req.query;

    if (!caregiverId || !date) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide caregiverId and date query parameters.',
      });
    }

    const existingBookings = await BookingModelAdapter.find({
      caregiverId,
      scheduledDate: date,
    });

    // Only active bookings count as occupied
    const activeBookings = existingBookings.filter((b) =>
      ['pending', 'confirmed', 'in_progress'].includes(b.status)
    );

    const bookedSlots = activeBookings.map((b) => ({
      bookingId: b.bookingId,
      scheduledTime: b.scheduledTime,
      duration: b.duration,
      status: b.status,
    }));

    return res.status(200).json({
      status: 'success',
      caregiverId,
      scheduledDate: date,
      bookedSlots,
    });
  } catch (error) {
    next(error);
  }
};

// 3. List bookings for the authenticated caller (role-aware)
const getBookings = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'caregiver') {
      // Find caregiver profile linked to this user
      const caregiver = await CaregiverModelAdapter.findByUserId(req.user.userId);
      if (!caregiver) {
        return res.status(200).json({ status: 'success', count: 0, data: [] });
      }
      query = { caregiverId: caregiver.caregiverId };
    } else if (req.user.role === 'user') {
      query = { userId: req.user.userId };
    } else if (req.user.role === 'admin') {
      query = {};
    }

    const rawBookings = await BookingModelAdapter.find(query);
    const enrichedList = await Promise.all(rawBookings.map((b) => enrichBooking(b)));

    return res.status(200).json({
      status: 'success',
      count: enrichedList.length,
      data: enrichedList,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get single booking details by ID
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await BookingModelAdapter.findById(id);

    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking record not found.',
      });
    }

    // Security Check: Caller must be the booking creator, assigned caregiver, or admin
    let isAuthorized = req.user.role === 'admin' || booking.userId === req.user.userId;

    if (!isAuthorized && req.user.role === 'caregiver') {
      const caregiver = await CaregiverModelAdapter.findByUserId(req.user.userId);
      if (caregiver && caregiver.caregiverId === booking.caregiverId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this booking record.',
      });
    }

    const enriched = await enrichBooking(booking);

    return res.status(200).json({
      status: 'success',
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update booking status (transitions: confirmed, in_progress, completed, cancelled)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid status. Must be one of: [${validStatuses.join(', ')}].`,
      });
    }

    const booking = await BookingModelAdapter.findById(id);
    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found.',
      });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot change status of a booking that is already ${booking.status}.`,
      });
    }

    // Role-based transition authorization
    let isCaregiver = false;
    if (req.user.role === 'caregiver') {
      const caregiver = await CaregiverModelAdapter.findByUserId(req.user.userId);
      if (caregiver && caregiver.caregiverId === booking.caregiverId) {
        isCaregiver = true;
      }
    }

    const isOwnerUser = booking.userId === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isCaregiver && !isOwnerUser && !isAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this booking.',
      });
    }

    // User can only cancel
    if (isOwnerUser && !isCaregiver && !isAdmin) {
      if (newStatus !== 'cancelled') {
        return res.status(403).json({
          status: 'fail',
          message: 'Family users can only cancel their booking requests.',
        });
      }
    }

    const updated = await BookingModelAdapter.updateBookingStatus(booking.bookingId || id, newStatus);
    const enriched = await enrichBooking(updated);

    return res.status(200).json({
      status: 'success',
      message: `Booking status updated to ${newStatus}.`,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  checkCaregiverAvailability,
  getBookings,
  getBookingById,
  updateBookingStatus,
};
