/**
 * One-time migration script for existing accounts
 * As specified in EMAIL_IMPLEMENTATION_SPECS.md (Phase 2)
 * Marks all existing users with isEmailVerified: true so existing members and nurses are never locked out.
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function migrateExistingUsers() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/caregiver_db';
  console.log('Connecting to database:', mongoUri);

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const collection = mongoose.connection.collection('users');
    const result = await collection.updateMany(
      { isEmailVerified: { $ne: true } },
      { $set: { isEmailVerified: true } }
    );

    console.log(`Migration completed successfully! Matched & updated ${result.modifiedCount} account(s) to isEmailVerified: true.`);
  } catch (error) {
    console.error('Migration encountered an error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

if (require.main === module) {
  migrateExistingUsers();
}

module.exports = migrateExistingUsers;

