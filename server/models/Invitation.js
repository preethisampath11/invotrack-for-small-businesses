import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    default: 'staff'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
