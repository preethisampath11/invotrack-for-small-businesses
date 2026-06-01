import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: 0.01
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Stripe', 'PayPal', 'Other'],
    default: 'Cash'
  },
  referenceNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
