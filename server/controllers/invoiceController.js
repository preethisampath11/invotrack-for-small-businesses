import Invoice from '../models/Invoice.js';
import Item from '../models/Item.js';
import Company from '../models/Company.js';
import Activity from '../models/Activity.js';
import Payment from '../models/Payment.js';

export const getInvoices = async (req, res) => {
  try {
    await Invoice.updateMany({
      companyId: req.user.companyId,
      status: 'sent',
      paymentStatus: { $ne: 'paid' },
      dueDate: { $lt: new Date() }
    }, { $set: { status: 'overdue' } });

    const { status, paymentStatus, search } = req.query;
    const filter = { companyId: req.user.companyId };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('clientId', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return res.json({ invoices });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, companyId: req.user.companyId })
      .populate('clientId')
      .populate('createdBy', 'name email');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    const company = await Company.findById(req.user.companyId);
    return res.json({ invoice, company });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { clientId, issueDate, dueDate, items, discount, notes } = req.body;
    const company = await Company.findById(req.user.companyId);

    const invoiceCount = await Invoice.countDocuments({ companyId: req.user.companyId });
    const invoiceNumber = `${company.settings.invoicePrefix}${String(invoiceCount + 1).padStart(5, '0')}`;

    let subtotal = 0;
    let taxTotal = 0;
    for (const item of items) {
      const lineTotal = item.quantity * item.rate;
      subtotal += lineTotal;
      taxTotal += lineTotal * (item.tax / 100);
    }
    const total = subtotal + taxTotal - (discount || 0);

    const invoice = await Invoice.create({
      invoiceNumber, companyId: req.user.companyId, clientId, issueDate, dueDate,
      items, discount: discount || 0, subtotal, taxTotal, total, notes,
      createdBy: req.user._id
    });

    for (const lineItem of items) {
      if (lineItem.itemId) {
        const dbItem = await Item.findById(lineItem.itemId);
        if (dbItem && dbItem.stock !== null) {
          dbItem.stock = Math.max(0, dbItem.stock - lineItem.quantity);
          await dbItem.save();
        }
      }
    }

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Created invoice', entityType: 'invoice', entityId: invoice._id,
        details: `Created ${invoiceNumber} for $${total.toFixed(2)}`
      });
      io.to(req.user.companyId.toString()).emit('invoices:updated');
      io.to(req.user.companyId.toString()).emit('inventory:updated');
      io.to(req.user.companyId.toString()).emit('dashboard:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    const populated = await Invoice.findById(invoice._id)
      .populate('clientId', 'name email')
      .populate('createdBy', 'name');

    return res.status(201).json({ invoice: populated });
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const { items, discount } = req.body;

    if (items) {
      let subtotal = 0;
      let taxTotal = 0;
      for (const item of items) {
        const lineTotal = item.quantity * item.rate;
        subtotal += lineTotal;
        taxTotal += lineTotal * (item.tax / 100);
      }
      req.body.subtotal = subtotal;
      req.body.taxTotal = taxTotal;
      req.body.total = subtotal + taxTotal - (discount || req.body.discount || 0);
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      req.body, { new: true, runValidators: true }
    ).populate('clientId', 'name email').populate('createdBy', 'name');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Updated invoice', entityType: 'invoice', entityId: invoice._id,
        details: `Updated ${invoice.invoiceNumber}`
      });
      io.to(req.user.companyId.toString()).emit('invoices:updated');
      io.to(req.user.companyId.toString()).emit('dashboard:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    return res.json({ invoice });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Deleted invoice', entityType: 'invoice',
        details: `Deleted ${invoice.invoiceNumber}`
      });
      io.to(req.user.companyId.toString()).emit('invoices:updated');
      io.to(req.user.companyId.toString()).emit('dashboard:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }
    return res.json({ message: 'Invoice deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    await Invoice.updateMany({
      companyId,
      status: 'sent',
      paymentStatus: { $ne: 'paid' },
      dueDate: { $lt: new Date() }
    }, { $set: { status: 'overdue' } });

    const invoices = await Invoice.find({ companyId });
    const items = await Item.find({ companyId });

    const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
    const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const outstanding = totalBilled - totalPaid;
    const paidCount = invoices.filter(i => i.paymentStatus === 'paid').length;
    const pendingCount = invoices.filter(i => i.status === 'sent' && i.paymentStatus !== 'paid').length;
    const overdueCount = invoices.filter(i => i.status === 'overdue').length;
    const cancelledCount = invoices.filter(i => i.status === 'cancelled').length;
    const draftCount = invoices.filter(i => i.status === 'draft').length;

    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthInvs = invoices.filter(inv => new Date(inv.createdAt) >= d && new Date(inv.createdAt) <= end);
      monthlyData.push({
        month: d.toLocaleString('default', { month: 'short' }),
        invoiced: monthInvs.reduce((s, inv) => s + inv.total, 0),
        received: monthInvs.reduce((s, inv) => s + inv.paidAmount, 0)
      });
    }

    const recentActivities = await Activity.find({ companyId }).sort({ createdAt: -1 }).limit(20);

    return res.json({
      stats: { totalBilled, totalPaid, outstanding, paidCount, pendingCount, overdueCount, cancelledCount, draftCount, totalInvoices: invoices.length, totalItems: items.length },
      monthlyData,
      recentActivities
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};
