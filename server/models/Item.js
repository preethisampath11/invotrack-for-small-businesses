import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  sku: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: 0
  },
  stock: {
    type: Number,
    default: null
  },
  isService: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Item = mongoose.model('Item', itemSchema);
export default Item;
