import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0
  }
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [invoiceItemSchema],
  discount: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    required: true
  },
  taxTotal: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'overdue', 'cancelled'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
