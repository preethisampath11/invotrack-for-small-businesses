import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  logoUrl: {
    type: String,
    default: null
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  taxId: {
    type: String,
    default: ''
  },
  settings: {
    currency: { type: String, default: 'USD' },
    currencySymbol: { type: String, default: '$' },
    taxRate: { type: Number, default: 0 },
    invoicePrefix: { type: String, default: 'INV-' },
    themeColor: { type: String, default: '#6366f1' },
    defaultNotes: { type: String, default: 'Thank you for your business!' },
    paymentTerms: { type: String, default: 'Net 30' },
    lowStockThreshold: { type: Number, default: 5 }
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Company = mongoose.model('Company', companySchema);
export default Company;
