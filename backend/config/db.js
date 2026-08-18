const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/caregiver_db', {
      serverSelectionTimeoutMS: 500,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[Database Warning] MongoDB connection failed: ${error.message}. Operating with in-memory database adapter for development.`);
    return false;
  }
};

module.exports = connectDB;
