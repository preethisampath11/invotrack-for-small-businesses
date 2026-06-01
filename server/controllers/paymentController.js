import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Activity from '../models/Activity.js';

export const getPayments = async (req, res) => {
  try {
    const filter = { companyId: req.user.companyId };
    if (req.query.invoiceId) filter.invoiceId = req.query.invoiceId;

    const payments = await Payment.find(filter)
      .populate('invoiceId', 'invoiceNumber total')
      .populate('recordedBy', 'name')
      .sort({ paymentDate: -1 });

    return res.json({ payments });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { invoiceId, amount, paymentDate, paymentMethod, referenceNumber, notes } = req.body;

    const invoice = await Invoice.findOne({ _id: invoiceId, companyId: req.user.companyId });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    const remaining = invoice.total - invoice.paidAmount;
    if (amount > remaining) {
      return res.status(400).json({ message: `Payment exceeds remaining balance of ${remaining.toFixed(2)}` });
    }

    const payment = await Payment.create({
      invoiceId, companyId: req.user.companyId, amount,
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod || 'Cash',
      referenceNumber, notes,
      recordedBy: req.user._id
    });

    invoice.paidAmount += amount;
    if (invoice.paidAmount >= invoice.total) {
      invoice.paymentStatus = 'paid';
    } else {
      invoice.paymentStatus = 'partial';
    }
    await invoice.save();

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Recorded payment', entityType: 'payment', entityId: payment._id,
        details: `Logged $${amount.toFixed(2)} ${paymentMethod || 'Cash'} payment for ${invoice.invoiceNumber}`
      });
      io.to(req.user.companyId.toString()).emit('payments:updated');
      io.to(req.user.companyId.toString()).emit('invoices:updated');
      io.to(req.user.companyId.toString()).emit('dashboard:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    const populated = await Payment.findById(payment._id)
      .populate('invoiceId', 'invoiceNumber total')
      .populate('recordedBy', 'name');

    return res.status(201).json({ payment: populated, invoice });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    const invoice = await Invoice.findById(payment.invoiceId);
    if (invoice) {
      invoice.paidAmount = Math.max(0, invoice.paidAmount - payment.amount);
      invoice.paymentStatus = invoice.paidAmount <= 0 ? 'unpaid' : 'partial';
      if (invoice.paymentStatus !== 'paid') {
        invoice.status = invoice.status === 'paid' ? 'sent' : invoice.status;
      }
      await invoice.save();
    }

    await Payment.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Deleted payment', entityType: 'payment',
        details: `Removed $${payment.amount.toFixed(2)} payment from ${invoice?.invoiceNumber || 'unknown'}`
      });
      io.to(req.user.companyId.toString()).emit('payments:updated');
      io.to(req.user.companyId.toString()).emit('invoices:updated');
      io.to(req.user.companyId.toString()).emit('dashboard:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    return res.json({ message: 'Payment deleted.', invoice });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};
