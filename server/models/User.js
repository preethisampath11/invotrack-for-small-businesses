import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'staff'],
    default: 'admin'
  },
  canEditInventory: {
    type: Boolean,
    default: false
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'deactivated'],
    default: 'active'
  },
  googleId: {
    type: String,
    default: null
  },
  preferences: {
    emailOnPayment: { type: Boolean, default: true },
    emailWeeklySummary: { type: Boolean, default: true }
  },
  sessionVersion: {
    type: Number,
    default: 1
  },
  scheduledDeletionDate: {
    type: Date,
    default: null
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
