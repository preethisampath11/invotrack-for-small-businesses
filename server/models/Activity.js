import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: ['invoice', 'payment', 'client', 'item', 'staff', 'settings'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  details: {
    type: String,
    default: ''
  },
  isAlert: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
