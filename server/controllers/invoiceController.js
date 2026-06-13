import Invoice from '../models/Invoice.js';
import Company from '../models/Company.js';
import { createInvoiceService, getDashboardStatsService } from '../services/InvoiceService.js';
import { generateInvoicePdf } from '../services/PdfService.js';
import { sendInvoiceEmail as sendEmailService } from '../services/EmailService.js';

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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const totalInvoices = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate('clientId', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({ 
      invoices, 
      totalPages: Math.ceil(totalInvoices / limit), 
      currentPage: page, 
      totalInvoices 
    });
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

export const createInvoice = async (req, res, next) => {
  try {
    const invoice = await createInvoiceService(req.body, req.user, req.app.get('io'));
    return res.status(201).json({ invoice });
  } catch (error) {
    next(error);
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

export const getDashboardStats = async (req, res, next) => {
  try {
    const data = await getDashboardStatsService(req.user.companyId);
    return res.json(data);
  } catch (error) {
    next(error);
  }
};

export const sendInvoiceEmail = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, companyId: req.user.companyId })
      .populate('clientId');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    const company = await Company.findById(req.user.companyId);
    
    const pdfBuffer = await generateInvoicePdf(invoice, company);
    await sendEmailService(invoice, company, pdfBuffer);
    
    if (invoice.status === 'draft') {
      invoice.status = 'sent';
      await invoice.save();
      
      const io = req.app.get('io');
      if (io) {
        io.to(req.user.companyId.toString()).emit('invoices:updated');
        io.to(req.user.companyId.toString()).emit('dashboard:updated');
      }
    }
    
    return res.json({ message: 'Invoice sent successfully', invoice });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, companyId: req.user.companyId })
      .populate('clientId');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    const company = await Company.findById(req.user.companyId);
    
    const pdfBuffer = await generateInvoicePdf(invoice, company);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
