const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    passwordHash: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['user', 'caregiver', 'admin'],
      default: 'user',
    },
    legalIdNumber: {
      type: String,
      default: 'N/A',
    },
    legalIdDocumentUrl: {
      type: String,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: function () {
        return this.role === 'caregiver' ? 'pending' : 'approved';
      },
    },
    legalIdVerified: {
      type: Boolean,
      default: function () {
        return this.role !== 'caregiver';
      },
    },
    profilePhotoUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Password Hash middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  if (!this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
    return enteredPassword === this.passwordHash;
  }
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Sanitize user object output
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject ? this.toObject() : { ...this };
  delete obj.passwordHash;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

// Memory fallback store if Mongoose is disconnected
const inMemoryUsers = new Map();

// Helper functions for unified memory/mongoose query abstraction
class UserModelAdapter {
  static async findByEmail(email) {
    if (mongoose.connection.readyState === 1) {
      return await User.findOne({ email: email.toLowerCase() });
    }
    const emailLower = email.toLowerCase();
    for (const u of inMemoryUsers.values()) {
      if (u.email === emailLower) return u;
    }
    return null;
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await User.findOne({ userId: id }) || await User.findById(id);
    }
    return inMemoryUsers.get(id) || null;
  }

  static async createUser(userData) {
    if (mongoose.connection.readyState === 1) {
      const user = new User(userData);
      await user.save();
      return user;
    }

    // Process memory user
    let hashedPassword = null;
    if (userData.passwordHash) {
      if (userData.passwordHash.startsWith('$2a$') || userData.passwordHash.startsWith('$2b$')) {
        hashedPassword = userData.passwordHash;
      } else {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(userData.passwordHash, salt);
      }
    }

    const memoryUser = {
      _id: userData.userId,
      userId: userData.userId,
      fullName: userData.fullName,
      email: userData.email.toLowerCase(),
      phone: userData.phone || '',
      passwordHash: hashedPassword,
      googleId: userData.googleId || null,
      authProvider: userData.authProvider || 'local',
      role: userData.role || 'user',
      legalIdNumber: userData.legalIdNumber || 'N/A',
      legalIdDocumentUrl: userData.legalIdDocumentUrl || null,
      verificationStatus: userData.verificationStatus || (userData.role === 'caregiver' ? 'pending' : 'approved'),
      legalIdVerified: userData.legalIdVerified !== undefined ? userData.legalIdVerified : (userData.role !== 'caregiver'),
      profilePhotoUrl: userData.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      comparePassword: async function (enteredPassword) {
        if (!this.passwordHash) return false;
        if (!this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
          return enteredPassword === this.passwordHash;
        }
        return await bcrypt.compare(enteredPassword, this.passwordHash);
      },
      toSafeObject: function () {
        const copy = { ...this };
        delete copy.passwordHash;
        delete copy.refreshToken;
        return copy;
      },
      save: async function () {
        inMemoryUsers.set(this.userId, this);
        return this;
      },
    };

    inMemoryUsers.set(memoryUser.userId, memoryUser);
    return memoryUser;
  }

  static async saveUser(user) {
    if (user.save && typeof user.save === 'function') {
      return await user.save();
    }
    inMemoryUsers.set(user.userId, user);
    return user;
  }

  static seedInitialData(usersArray) {
    usersArray.forEach((u) => inMemoryUsers.set(u.userId, u));
  }
}

const User = mongoose.model('User', userSchema);

module.exports = {
  User,
  UserModelAdapter,
};
