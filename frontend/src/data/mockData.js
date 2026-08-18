// Mock Initial Data based on Elderly-Care.Spec.md Data Models (Sections 6 & 7)

export const MOCK_SERVICES = [
  {
    serviceId: "SVC001",
    serviceName: "Elderly Home Nursing Care",
    description: "Skilled nursing support for medication management, wound care, post-op recovery, and vital monitoring at home.",
    durationOptions: ["4 hr", "12 hr", "24 hr"],
    price: 800,
    requiredQualification: "B.Sc Nursing / GNM",
    category: "medical",
    icon: "Stethoscope",
    popular: true,
  },
  {
    serviceId: "SVC002",
    serviceName: "Physiotherapy Session",
    description: "In-home physiotherapy for mobility recovery, joint pain relief, stroke rehab, and post-surgery rehabilitation.",
    durationOptions: ["1 hr"],
    price: 600,
    requiredQualification: "Doctor of Physiotherapy (DPT/BPT)",
    category: "rehabilitation",
    icon: "Activity",
    popular: true,
  },
  {
    serviceId: "SVC003",
    serviceName: "General Attendant Care",
    description: "Non-medical assistance including mobility support, feeding, bathing, hygiene, and daily companionship.",
    durationOptions: ["8 hr", "12 hr", "24 hr"],
    price: 500,
    requiredQualification: "Certified Home Attendant Training",
    category: "non_medical",
    icon: "HeartHandshake",
    popular: false,
  },
  {
    serviceId: "SVC004",
    serviceName: "Dementia & Memory Care Support",
    description: "Specialized cognitive assistance, safety monitoring, routine maintenance, and emotional care for dementia/Alzheimer's patients.",
    durationOptions: ["6 hr", "12 hr"],
    price: 750,
    requiredQualification: "Geriatric & Cognitive Care Certification",
    category: "medical",
    icon: "Brain",
    popular: false,
  }
];

export const MOCK_PATIENTS = [
  {
    patientId: "PAT-101",
    linkedUserId: "USER-001",
    fullName: "Ramesh Sharma",
    age: 76,
    gender: "Male",
    medicalHistory: "Hypertension, Type 2 Diabetes, mild arthritis in right knee. Requires daily BP and blood sugar tracking.",
    mobilityStatus: "assisted",
    emergencyContactName: "Vikram Sharma (Son)",
    emergencyContactPhone: "+91 98765 43210",
    address: "42-B Parkview Apartments, Green Park, New Delhi",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"
  },
  {
    patientId: "PAT-102",
    linkedUserId: "USER-001",
    fullName: "Kamla Sharma",
    age: 72,
    gender: "Female",
    medicalHistory: "Post-hip replacement rehabilitation, osteoporosis. Requires assistance with mobility exercises and bathing.",
    mobilityStatus: "assisted",
    emergencyContactName: "Vikram Sharma (Son)",
    emergencyContactPhone: "+91 98765 43210",
    address: "42-B Parkview Apartments, Green Park, New Delhi",
    photoUrl: "https://images.unsplash.com/photo-1566616213894-269115ecf328?auto=format&fit=crop&w=300&q=80"
  }
];

export const MOCK_CAREGIVERS = [
  {
    caregiverId: "CG-201",
    linkedUserId: "USER-002",
    fullName: "Anita Sharma, RN",
    specialization: "nurse",
    qualification: "B.Sc Nursing",
    yearsExperience: 8,
    certificationDocsUrl: ["/docs/nursing_license.pdf"],
    availability: [
      { day: "Monday", startTime: "08:00", endTime: "20:00" },
      { day: "Tuesday", startTime: "08:00", endTime: "20:00" },
      { day: "Wednesday", startTime: "08:00", endTime: "20:00" },
      { day: "Thursday", startTime: "08:00", endTime: "20:00" },
      { day: "Friday", startTime: "08:00", endTime: "20:00" },
    ],
    rating: 4.9,
    reviewsCount: 34,
    serviceAreas: ["South Delhi", "Green Park", "Hauz Khas", "Saket"],
    verified: true,
    bio: "Compassionate registered nurse with 8+ years experience in ICU care and geriatric home nursing.",
    photoUrl: "https://images.unsplash.com/photo-1594824813566-88855ce7890b?auto=format&fit=crop&w=300&q=80"
  },
  {
    caregiverId: "CG-202",
    linkedUserId: "USER-003",
    fullName: "Dr. Rajesh Verma (PT)",
    specialization: "physiotherapist",
    qualification: "Bachelor of Physiotherapy (BPT)",
    yearsExperience: 6,
    certificationDocsUrl: ["/docs/pt_license.pdf"],
    availability: [
      { day: "Monday", startTime: "09:00", endTime: "18:00" },
      { day: "Wednesday", startTime: "09:00", endTime: "18:00" },
      { day: "Friday", startTime: "09:00", endTime: "18:00" },
      { day: "Saturday", startTime: "10:00", endTime: "16:00" },
    ],
    rating: 4.8,
    reviewsCount: 29,
    serviceAreas: ["Vasant Kunj", "Saket", "Green Park"],
    verified: true,
    bio: "Specialist in orthopedic physiotherapy, joint mobilization, and post-operative mobility recovery for seniors.",
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80"
  },
  {
    caregiverId: "CG-203",
    linkedUserId: "USER-004",
    fullName: "Sunita Rao",
    specialization: "attendant",
    qualification: "Certified Home Attendant Training",
    yearsExperience: 5,
    certificationDocsUrl: ["/docs/attendant_cert.pdf"],
    availability: [
      { day: "Monday", startTime: "07:00", endTime: "19:00" },
      { day: "Tuesday", startTime: "07:00", endTime: "19:00" },
      { day: "Wednesday", startTime: "07:00", endTime: "19:00" },
      { day: "Thursday", startTime: "07:00", endTime: "19:00" },
      { day: "Friday", startTime: "07:00", endTime: "19:00" },
      { day: "Saturday", startTime: "07:00", endTime: "19:00" },
    ],
    rating: 4.7,
    reviewsCount: 42,
    serviceAreas: ["Green Park", "Greater Kailash", "Def Col"],
    verified: true,
    bio: "Patient and attentive home care companion dedicated to daily assistance, personal hygiene, and safety for elderly individuals.",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
  }
];

export const MOCK_BOOKINGS = [
  {
    bookingId: "BK-8001",
    userId: "USER-001",
    patientId: "PAT-101",
    caregiverId: "CG-201",
    serviceId: "SVC001",
    serviceName: "Elderly Home Nursing Care",
    patientName: "Ramesh Sharma",
    caregiverName: "Anita Sharma, RN",
    scheduledDate: "2026-08-18",
    scheduledTime: "09:00 AM",
    duration: "4 hr",
    status: "confirmed",
    totalPrice: 800,
    paymentStatus: "paid",
    createdAt: "2026-08-15T10:30:00Z"
  },
  {
    bookingId: "BK-8002",
    userId: "USER-001",
    patientId: "PAT-102",
    caregiverId: "CG-202",
    serviceId: "SVC002",
    serviceName: "Physiotherapy Session",
    patientName: "Kamla Sharma",
    caregiverName: "Dr. Rajesh Verma (PT)",
    scheduledDate: "2026-08-16",
    scheduledTime: "11:00 AM",
    duration: "1 hr",
    status: "in_progress",
    totalPrice: 600,
    paymentStatus: "paid",
    createdAt: "2026-08-14T14:15:00Z"
  }
];

export const MOCK_CARE_NOTES = [
  {
    noteId: "NOTE-901",
    bookingId: "BK-8002",
    caregiverId: "CG-202",
    patientId: "PAT-102",
    vitals: {
      bp: "128/82 mmHg",
      pulse: "74 bpm",
      temperature: "98.4 °F",
      sugarLevel: "110 mg/dL"
    },
    tasksPerformed: [
      "Monitored vital signs before and after session",
      "Assisted with 30-min passive hip rotation & quadriceps strengthening exercises",
      "Gait training with walker (15 minutes walk in corridor)"
    ],
    observations: "Patient showed improved range of motion in right hip. Reported mild knee soreness after walk, applied ice pack. Mood cheerful.",
    timestamp: "2026-08-16T11:45:00Z",
    attachmentUrls: []
  }
];
