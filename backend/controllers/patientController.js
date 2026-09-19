const { PatientModelAdapter, Patient } = require('../models/Patient');

// 1. Get all patient profiles for the authenticated family user
const getPatients = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const query = req.user.role === 'admin' ? {} : { linkedUserId: userId };

    const patients = await PatientModelAdapter.find(query);

    return res.status(200).json({
      status: 'success',
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get a single patient profile by ID
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await PatientModelAdapter.findById(id);

    if (!patient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient profile not found.',
      });
    }

    // Ownership check: Caller must be the linked family user or an admin
    if (patient.linkedUserId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this patient profile.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create a new patient profile
const createPatient = async (req, res, next) => {
  try {
    const {
      fullName,
      age,
      gender,
      medicalHistory,
      mobilityStatus,
      emergencyContactName,
      emergencyContactPhone,
      address,
      photoUrl,
    } = req.body;

    // Required fields validation
    if (!fullName || !age || !gender || !emergencyContactName || !emergencyContactPhone || !address) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide fullName, age, gender, emergencyContactName, emergencyContactPhone, and address.',
      });
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 130) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please enter a valid age between 0 and 130.',
      });
    }

    const validMobility = ['independent', 'assisted', 'bedridden'];
    const chosenMobility = validMobility.includes(mobilityStatus) ? mobilityStatus : 'assisted';

    const patientId = `PAT-${Date.now().toString().slice(-6)}`;

    const newPatient = await PatientModelAdapter.createPatient({
      patientId,
      linkedUserId: req.user.userId,
      fullName: fullName.trim(),
      age: parsedAge,
      gender,
      medicalHistory: medicalHistory ? medicalHistory.trim() : '',
      mobilityStatus: chosenMobility,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      address: address.trim(),
      photoUrl:
        photoUrl ||
        (gender.toLowerCase() === 'female'
          ? 'https://images.unsplash.com/photo-1566616213894-269115ecf328?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'),
    });

    return res.status(201).json({
      status: 'success',
      message: 'Patient profile created successfully.',
      data: newPatient,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update an existing patient profile
const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await PatientModelAdapter.findById(id);

    if (!patient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient profile not found.',
      });
    }

    // Ownership check
    if (patient.linkedUserId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to modify this patient profile.',
      });
    }

    const {
      fullName,
      age,
      gender,
      medicalHistory,
      mobilityStatus,
      emergencyContactName,
      emergencyContactPhone,
      address,
      photoUrl,
    } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (age !== undefined) {
      const parsedAge = parseInt(age, 10);
      if (!isNaN(parsedAge)) updateData.age = parsedAge;
    }
    if (gender !== undefined) updateData.gender = gender;
    if (medicalHistory !== undefined) updateData.medicalHistory = medicalHistory.trim();
    if (mobilityStatus !== undefined) {
      const validMobility = ['independent', 'assisted', 'bedridden'];
      if (validMobility.includes(mobilityStatus)) {
        updateData.mobilityStatus = mobilityStatus;
      }
    }
    if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName.trim();
    if (emergencyContactPhone !== undefined) updateData.emergencyContactPhone = emergencyContactPhone.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    const updatedPatient = await PatientModelAdapter.updatePatient(patient.patientId || id, updateData);

    return res.status(200).json({
      status: 'success',
      message: 'Patient profile updated successfully.',
      data: updatedPatient,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete a patient profile
const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await PatientModelAdapter.findById(id);

    if (!patient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient profile not found.',
      });
    }

    // Ownership check
    if (patient.linkedUserId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to delete this patient profile.',
      });
    }

    await PatientModelAdapter.deletePatient(patient.patientId || id);

    return res.status(200).json({
      status: 'success',
      message: 'Patient profile removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
