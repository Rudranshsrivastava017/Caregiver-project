const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const caregiverRoutes = require('./routes/caregiverRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const { UserModelAdapter } = require('./models/User');
const { PatientModelAdapter } = require('./models/Patient');
const { ServiceModelAdapter } = require('./models/Service');
const { CaregiverModelAdapter } = require('./models/Caregiver');
const { BookingModelAdapter } = require('./models/Booking');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup for credentialed cookies (HttpOnly refresh token)
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(cookieParser());

// Seed initial test users so presets & test logins work seamlessly out-of-the-box
const seedDefaultUsers = async () => {
  const defaultUsers = [
    {
      userId: 'USER-001',
      fullName: 'Vikram Sharma',
      email: 'vikram@careelderly.org',
      phone: '+91 98765 43210',
      passwordHash: 'password123',
      role: 'user',
      legalIdNumber: 'PAN-XXXX-1029',
      verificationStatus: 'approved',
      legalIdVerified: true,
      profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      userId: 'CG-201',
      fullName: 'Anita Sharma, RN',
      email: 'anita.nurse@careelderly.org',
      phone: '+91 98765 12345',
      passwordHash: 'password123',
      role: 'caregiver',
      legalIdNumber: 'AADHAAR-8839-2019',
      verificationStatus: 'approved',
      legalIdVerified: true,
      profilePhotoUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?auto=format&fit=crop&w=300&q=80',
    },
    {
      userId: 'CG-999',
      fullName: 'Priya Malhotra',
      email: 'pending.caregiver@careelderly.org',
      phone: '+91 98111 22233',
      passwordHash: 'password123',
      role: 'caregiver',
      legalIdNumber: 'VOTER-9921-3312',
      verificationStatus: 'pending',
      legalIdVerified: false,
      profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
  ];

  for (const u of defaultUsers) {
    const existing = await UserModelAdapter.findByEmail(u.email);
    if (!existing) {
      await UserModelAdapter.createUser(u);
    }
  }

  // Seed default patient profiles for Vikram Sharma (USER-001)
  const defaultPatients = [
    {
      patientId: 'PAT-101',
      linkedUserId: 'USER-001',
      fullName: 'Ramesh Sharma',
      age: 76,
      gender: 'Male',
      medicalHistory: 'Hypertension, Type 2 Diabetes, mild arthritis in right knee. Requires daily BP and blood sugar tracking.',
      mobilityStatus: 'assisted',
      emergencyContactName: 'Vikram Sharma (Son)',
      emergencyContactPhone: '+91 98765 43210',
      address: '42-B Parkview Apartments, Green Park, New Delhi',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
    {
      patientId: 'PAT-102',
      linkedUserId: 'USER-001',
      fullName: 'Kamla Sharma',
      age: 72,
      gender: 'Female',
      medicalHistory: 'Post-hip replacement rehabilitation, osteoporosis. Requires assistance with mobility exercises and bathing.',
      mobilityStatus: 'assisted',
      emergencyContactName: 'Vikram Sharma (Son)',
      emergencyContactPhone: '+91 98765 43210',
      address: '42-B Parkview Apartments, Green Park, New Delhi',
      photoUrl: 'https://images.unsplash.com/photo-1566616213894-269115ecf328?auto=format&fit=crop&w=300&q=80',
    },
  ];

  for (const p of defaultPatients) {
    const existing = await PatientModelAdapter.findById(p.patientId);
    if (!existing) {
      await PatientModelAdapter.createPatient(p);
    }
  }

  // Seed default Healthcare Services Catalog
  const defaultServices = [
    {
      serviceId: 'SVC001',
      serviceName: 'Elderly Home Nursing Care',
      description: 'Skilled nursing support for medication management, wound care, post-op recovery, and vital monitoring at home.',
      durationOptions: ['4 hr', '12 hr', '24 hr'],
      price: 800,
      requiredQualification: 'B.Sc Nursing / GNM',
      category: 'medical',
    },
    {
      serviceId: 'SVC002',
      serviceName: 'Physiotherapy Session',
      description: 'In-home physiotherapy for mobility recovery, joint pain relief, stroke rehab, and post-surgery rehabilitation.',
      durationOptions: ['1 hr'],
      price: 600,
      requiredQualification: 'Doctor of Physiotherapy (DPT/BPT)',
      category: 'rehabilitation',
    },
    {
      serviceId: 'SVC003',
      serviceName: 'General Attendant Care',
      description: 'Non-medical assistance including mobility support, feeding, bathing, hygiene, and daily companionship.',
      durationOptions: ['8 hr', '12 hr', '24 hr'],
      price: 500,
      requiredQualification: 'Certified Home Attendant Training',
      category: 'non_medical',
    },
    {
      serviceId: 'SVC004',
      serviceName: 'Dementia & Memory Care Support',
      description: 'Specialized cognitive assistance, safety monitoring, routine maintenance, and emotional care for dementia/Alzheimer\'s patients.',
      durationOptions: ['6 hr', '12 hr'],
      price: 750,
      requiredQualification: 'Geriatric & Cognitive Care Certification',
      category: 'medical',
    },
  ];

  for (const s of defaultServices) {
    const existing = await ServiceModelAdapter.findById(s.serviceId);
    if (!existing) {
      await ServiceModelAdapter.createService(s);
    }
  }

  // Seed default Healthcare Professionals / Caregivers
  const defaultCaregivers = [
    {
      caregiverId: 'CG-201',
      linkedUserId: 'USER-002',
      fullName: 'Anita Sharma, RN',
      specialization: 'nurse',
      qualification: 'B.Sc Nursing',
      yearsExperience: 8,
      certificationDocsUrl: ['/docs/nursing_license.pdf'],
      availability: [
        { day: 'Monday', startTime: '08:00', endTime: '20:00' },
        { day: 'Tuesday', startTime: '08:00', endTime: '20:00' },
        { day: 'Wednesday', startTime: '08:00', endTime: '20:00' },
        { day: 'Thursday', startTime: '08:00', endTime: '20:00' },
        { day: 'Friday', startTime: '08:00', endTime: '20:00' },
      ],
      rating: 4.9,
      reviewsCount: 34,
      serviceAreas: ['South Delhi', 'Green Park', 'Hauz Khas', 'Saket'],
      verified: true,
      bio: 'Compassionate registered nurse with 8+ years experience in ICU care and geriatric home nursing.',
      photoUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?auto=format&fit=crop&w=300&q=80',
    },
    {
      caregiverId: 'CG-202',
      linkedUserId: 'USER-003',
      fullName: 'Dr. Rajesh Verma (PT)',
      specialization: 'physiotherapist',
      qualification: 'Bachelor of Physiotherapy (BPT)',
      yearsExperience: 6,
      certificationDocsUrl: ['/docs/pt_license.pdf'],
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '18:00' },
        { day: 'Wednesday', startTime: '09:00', endTime: '18:00' },
        { day: 'Friday', startTime: '09:00', endTime: '18:00' },
        { day: 'Saturday', startTime: '10:00', endTime: '16:00' },
      ],
      rating: 4.8,
      reviewsCount: 29,
      serviceAreas: ['Vasant Kunj', 'Saket', 'Green Park'],
      verified: true,
      bio: 'Specialist in orthopedic physiotherapy, joint mobilization, and post-operative mobility recovery for seniors.',
      photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
    },
    {
      caregiverId: 'CG-203',
      linkedUserId: 'USER-004',
      fullName: 'Sunita Rao',
      specialization: 'attendant',
      qualification: 'Certified Home Attendant Training',
      yearsExperience: 5,
      certificationDocsUrl: ['/docs/attendant_cert.pdf'],
      availability: [
        { day: 'Monday', startTime: '07:00', endTime: '19:00' },
        { day: 'Tuesday', startTime: '07:00', endTime: '19:00' },
        { day: 'Wednesday', startTime: '07:00', endTime: '19:00' },
        { day: 'Thursday', startTime: '07:00', endTime: '19:00' },
        { day: 'Friday', startTime: '07:00', endTime: '19:00' },
        { day: 'Saturday', startTime: '07:00', endTime: '19:00' },
      ],
      rating: 4.7,
      reviewsCount: 42,
      serviceAreas: ['Green Park', 'Greater Kailash', 'Def Col'],
      verified: true,
      bio: 'Patient and attentive home care companion dedicated to daily assistance, personal hygiene, and safety for elderly individuals.',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
  ];

  for (const cg of defaultCaregivers) {
    const existing = await CaregiverModelAdapter.findById(cg.caregiverId);
    if (!existing) {
      await CaregiverModelAdapter.createCaregiver(cg);
    }
  }

  // Seed default Demo Bookings for Vikram Sharma (USER-001)
  const defaultBookings = [
    {
      bookingId: 'BK-8001',
      userId: 'USER-001',
      patientId: 'PAT-101',
      caregiverId: 'CG-201',
      serviceId: 'SVC001',
      scheduledDate: '2026-09-22',
      scheduledTime: 'Morning (08:00 AM - 12:00 PM)',
      duration: '4 Hours',
      status: 'confirmed',
      totalPrice: 800,
    },
    {
      bookingId: 'BK-8002',
      userId: 'USER-001',
      patientId: 'PAT-102',
      caregiverId: 'CG-202',
      serviceId: 'SVC002',
      scheduledDate: '2026-09-23',
      scheduledTime: 'Afternoon (12:00 PM - 04:00 PM)',
      duration: '1 hr',
      status: 'in_progress',
      totalPrice: 600,
    },
  ];

  for (const b of defaultBookings) {
    const existing = await BookingModelAdapter.findById(b.bookingId);
    if (!existing) {
      await BookingModelAdapter.createBooking(b);
    }
  }

  console.log('[Server Seed] Default test accounts, elderly patient profiles, services catalog, caregivers, and bookings initialized.');
};

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CareElderly Healthcare Authentication Server is active.',
    timestamp: new Date().toISOString(),
  });
});

// Auth Routes
app.use('/api/v1/auth', authRoutes);

// Patient Profile CRUD Routes
app.use('/api/v1/patients', patientRoutes);

// Catalog Routes (Services & Caregivers)
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/caregivers', caregiverRoutes);

// Booking Flow Routes (No payment, with conflict prevention)
app.use('/api/v1/bookings', bookingRoutes);

// Global Error Handler
app.use(errorHandler);

// Start server & initialize DB asynchronously
app.listen(PORT, () => {
  console.log(`[Server Running] CareElderly Backend API running on http://localhost:${PORT}`);
  connectDB().then(() => {
    seedDefaultUsers();
  });
});
