import mongoose from 'mongoose';

const sequenceSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  sequenceName: {
    type: String,
    required: true,
  },
  sequenceValue: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

// Ensure unique sequence name per company
sequenceSchema.index({ companyId: 1, sequenceName: 1 }, { unique: true });

export default mongoose.model('Sequence', sequenceSchema);
