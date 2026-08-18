const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const { UserModelAdapter } = require('./models/User');

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
  console.log('[Server Seed] Default test accounts initialized for demo/testing.');
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

// Global Error Handler
app.use(errorHandler);

// Start server & initialize DB asynchronously
app.listen(PORT, () => {
  console.log(`[Server Running] CareElderly Backend API running on http://localhost:${PORT}`);
  connectDB().then(() => {
    seedDefaultUsers();
  });
});
