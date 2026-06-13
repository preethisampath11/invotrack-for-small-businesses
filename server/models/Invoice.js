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
  },

  // ── Recurring billing ────────────────────────────────────────────────────
  /** True on the template invoice; false on auto-generated copies. */
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringInterval: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly'],
    default: 'monthly'
  },
  /**
   * Only meaningful when isRecurring=true.
   * 'active'   — cron will generate copies each cycle
   * 'paused'   — cron skips this template until resumed
   * 'cancelled' — cron permanently ignores this template
   */
  recurringStatus: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  },
  /** The date the cron job should next generate a copy of this invoice. */
  nextBillingDate: {
    type: Date,
    default: null
  },
  /** On auto-generated copies: points back to the recurring template. */
  parentInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  }
}, {
  timestamps: true
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
