import mongoose from 'mongoose';

/**
 * Advances a date by one recurring interval.
 * Used both when creating the first template and after each cron cycle.
 */
export const addIntervalToDate = (date, interval) => {
  const d = new Date(date);
  switch (interval) {
    case 'weekly':    d.setDate(d.getDate() + 7);    break;
    case 'monthly':   d.setMonth(d.getMonth() + 1);  break;
    case 'quarterly': d.setMonth(d.getMonth() + 3);  break;
    default:          d.setMonth(d.getMonth() + 1);
  }
  return d;
};
import Invoice from '../models/Invoice.js';
import Item from '../models/Item.js';
import Company from '../models/Company.js';
import Activity from '../models/Activity.js';
import Sequence from '../models/Sequence.js';

export const createInvoiceService = async (invoiceData, user, io) => {
  const {
    clientId, issueDate, dueDate, items, discount, notes,
    isRecurring = false,
    recurringInterval = 'monthly',
  } = invoiceData;
  const company = await Company.findById(user.companyId);

  const sequenceDoc = await Sequence.findOneAndUpdate(
    { companyId: user.companyId, sequenceName: 'invoice' },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  const invoiceNumber = `${company.settings.invoicePrefix}${String(sequenceDoc.sequenceValue).padStart(5, '0')}`;

  let subtotal = 0;
  let taxTotal = 0;
  for (const item of items) {
    const lineTotal = item.quantity * item.rate;
    subtotal += lineTotal;
    taxTotal += lineTotal * (item.tax / 100);
  }
  const total = subtotal + taxTotal - (discount || 0);

  // For recurring templates, set the first nextBillingDate = issueDate + 1 interval
  const nextBillingDate = isRecurring
    ? addIntervalToDate(issueDate, recurringInterval)
    : null;

  const invoice = await Invoice.create({
    invoiceNumber, companyId: user.companyId, clientId, issueDate, dueDate,
    items, discount: discount || 0, subtotal, taxTotal, total, notes,
    createdBy: user._id,
    isRecurring,
    recurringInterval,
    recurringStatus: isRecurring ? 'active' : 'active', // always active on create
    nextBillingDate,
  });

  for (const lineItem of items) {
    if (lineItem.itemId) {
      await Item.updateOne(
        { _id: lineItem.itemId, stock: { $ne: null } },
        { $inc: { stock: -lineItem.quantity } }
      );
    }
  }

  if (io) {
    await Activity.create({
      companyId: user.companyId, userId: user._id, userName: user.name,
      action: 'Created invoice', entityType: 'invoice', entityId: invoice._id,
      details: `Created ${invoiceNumber} for $${total.toFixed(2)}`
    });
    io.to(user.companyId.toString()).emit('invoices:updated');
    io.to(user.companyId.toString()).emit('inventory:updated');
    io.to(user.companyId.toString()).emit('dashboard:updated');
    io.to(user.companyId.toString()).emit('activity:new');
  }

  return Invoice.findById(invoice._id)
    .populate('clientId', 'name email')
    .populate('createdBy', 'name');
};

export const getDashboardStatsService = async (companyId) => {
  await Invoice.updateMany({
    companyId,
    status: 'sent',
    paymentStatus: { $ne: 'paid' },
    dueDate: { $lt: new Date() }
  }, { $set: { status: 'overdue' } });

  const itemsCount = await Item.countDocuments({ companyId });

  const statsAgg = await Invoice.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
    { $group: {
        _id: null,
        totalBilled: { $sum: "$total" },
        totalPaid: { $sum: "$paidAmount" },
        paidCount: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
        pendingCount: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "sent"] }, { $ne: ["$paymentStatus", "paid"] }] }, 1, 0] } },
        overdueCount: { $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] } },
        cancelledCount: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        draftCount: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
        totalInvoices: { $sum: 1 }
    }}
  ]);

  const s = statsAgg[0] || {
    totalBilled: 0, totalPaid: 0, paidCount: 0, pendingCount: 0, overdueCount: 0, cancelledCount: 0, draftCount: 0, totalInvoices: 0
  };
  const outstanding = s.totalBilled - s.totalPaid;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const monthlyAgg = await Invoice.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId), createdAt: { $gte: sixMonthsAgo } } },
    { $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        invoiced: { $sum: "$total" },
        received: { $sum: "$paidAmount" }
    }},
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const match = monthlyAgg.find(m => m._id.year === d.getFullYear() && m._id.month === (d.getMonth() + 1));
    monthlyData.push({
      month: d.toLocaleString('default', { month: 'short' }),
      invoiced: match ? match.invoiced : 0,
      received: match ? match.received : 0
    });
  }

  const recentActivities = await Activity.find({ companyId }).sort({ createdAt: -1 }).limit(20);

  return {
    stats: { 
      totalBilled: s.totalBilled, totalPaid: s.totalPaid, outstanding, 
      paidCount: s.paidCount, pendingCount: s.pendingCount, overdueCount: s.overdueCount, 
      cancelledCount: s.cancelledCount, draftCount: s.draftCount, 
      totalInvoices: s.totalInvoices, totalItems: itemsCount 
    },
    monthlyData,
    recentActivities
  };
};
