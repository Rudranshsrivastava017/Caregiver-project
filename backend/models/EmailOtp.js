const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['family', 'nurse'], required: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verificationTokenHash: { type: String, default: null },
  sendCount: { type: Number, default: 1 },
  lastSentAt: { type: Date, default: Date.now },
  windowStartedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// One active record per email + role
emailOtpSchema.index({ email: 1, role: 1 }, { unique: true });

// MongoDB deletes the document automatically after expiresAt
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtpModel = mongoose.models.EmailOtp || mongoose.model('EmailOtp', emailOtpSchema);

// Memory fallback store for offline tests and decoupled environments
const inMemoryOtps = new Map();

const origFindOne = EmailOtpModel.findOne.bind(EmailOtpModel);
const origCreate = EmailOtpModel.create.bind(EmailOtpModel);
const origDeleteOne = EmailOtpModel.deleteOne.bind(EmailOtpModel);

EmailOtpModel.findOne = function (conditions = {}, ...args) {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return origFindOne(conditions, ...args);
  }

  const email = conditions.email ? conditions.email.toLowerCase().trim() : null;
  const role = conditions.role;
  const key = `${email}:${role}`;
  const doc = inMemoryOtps.get(key);

  if (!doc) return Promise.resolve(null);
  if (conditions.verified !== undefined && doc.verified !== conditions.verified) {
    return Promise.resolve(null);
  }
  return Promise.resolve(doc);
};

EmailOtpModel.create = function (data, ...args) {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return origCreate(data, ...args);
  }

  const email = data.email.toLowerCase().trim();
  const role = data.role;
  const key = `${email}:${role}`;
  const now = new Date();

  const doc = {
    _id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email,
    role,
    otpHash: data.otpHash,
    attempts: data.attempts || 0,
    verified: data.verified || false,
    verificationTokenHash: data.verificationTokenHash || null,
    sendCount: data.sendCount || 1,
    lastSentAt: data.lastSentAt || now,
    windowStartedAt: data.windowStartedAt || now,
    expiresAt: data.expiresAt,
    save: async function () {
      inMemoryOtps.set(key, this);
      return this;
    },
  };

  inMemoryOtps.set(key, doc);
  return Promise.resolve(doc);
};

EmailOtpModel.deleteOne = function (conditions = {}, ...args) {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return origDeleteOne(conditions, ...args);
  }

  for (const [k, v] of inMemoryOtps.entries()) {
    if (conditions._id && String(v._id) === String(conditions._id)) {
      inMemoryOtps.delete(k);
      return Promise.resolve({ deletedCount: 1 });
    }
    if (conditions.email && v.email === conditions.email.toLowerCase().trim()) {
      inMemoryOtps.delete(k);
      return Promise.resolve({ deletedCount: 1 });
    }
  }
  return Promise.resolve({ deletedCount: 0 });
};

module.exports = EmailOtpModel;

