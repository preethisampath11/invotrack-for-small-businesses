import Company from '../models/Company.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Item from '../models/Item.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';

export const getSettings = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    const user = await User.findById(req.user._id).select('preferences scheduledDeletionDate');
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    return res.json({ company, preferences: user.preferences, scheduledDeletionDate: user.scheduledDeletionDate });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { name, phone, email, taxId, address, settings, preferences, convertCurrency, oldCurrency } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (email !== undefined) update.email = email;
    if (taxId !== undefined) update.taxId = taxId;
    if (address) update.address = address;
    if (settings) update.settings = settings;

    const company = await Company.findByIdAndUpdate(
      req.user.companyId, update, { new: true, runValidators: true }
    );

    if (!company) return res.status(404).json({ message: 'Company not found.' });

    if (preferences) {
      await User.findByIdAndUpdate(req.user._id, { preferences });
    }

    if (convertCurrency && oldCurrency && settings?.currency && oldCurrency !== settings.currency) {
      try {
        const fetch = globalThis.fetch;
        const rateResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/${oldCurrency}`);
        const rateData = await rateResponse.json();
        const multiplier = rateData.rates[settings.currency];

        if (multiplier) {
          const items = await Item.find({ companyId: req.user.companyId });
          for (const item of items) {
            if (item.unitPrice) {
              item.unitPrice = Number((item.unitPrice * multiplier).toFixed(2));
              await item.save();
            }
          }

          const invoices = await Invoice.find({ companyId: req.user.companyId });
          for (const invoice of invoices) {
            invoice.subtotal = Number((invoice.subtotal * multiplier).toFixed(2));
            invoice.taxTotal = Number((invoice.taxTotal * multiplier).toFixed(2));
            invoice.total = Number((invoice.total * multiplier).toFixed(2));
            invoice.paidAmount = Number((invoice.paidAmount * multiplier).toFixed(2));
            if (invoice.discount) invoice.discount = Number((invoice.discount * multiplier).toFixed(2));
            invoice.items.forEach(i => {
              if (i.rate) i.rate = Number((i.rate * multiplier).toFixed(2));
            });
            await invoice.save();
          }

          const payments = await Payment.find({ companyId: req.user.companyId });
          for (const payment of payments) {
            payment.amount = Number((payment.amount * multiplier).toFixed(2));
            await payment.save();
          }
        }
      } catch (rateError) {
        console.error('Failed to convert currencies:', rateError);
      }
    }

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Updated company settings', entityType: 'settings',
        details: 'Company settings updated'
      });
      io.to(req.user.companyId.toString()).emit('settings:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    return res.json({ company });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const company = await Company.findByIdAndUpdate(
      req.user.companyId,
      { logoUrl: dataUri },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(req.user.companyId.toString()).emit('settings:updated');
    }

    return res.json({ company });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.sessionVersion += 1;
    await user.save();
    return res.json({ message: 'Logged out of all other devices successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const exportData = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const [company, users, clients, items, invoices, payments, activities] = await Promise.all([
      Company.findById(companyId),
      User.find({ companyId }).select('-passwordHash'),
      Client.find({ companyId }),
      Item.find({ companyId }),
      Invoice.find({ companyId }),
      Payment.find({ companyId }),
      Activity.find({ companyId })
    ]);

    const exportObject = {
      exportedAt: new Date(),
      company, users, clients, items, invoices, payments, activities
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=invotrack_export.json');
    return res.json(exportObject);
  } catch (error) {
    return res.status(500).json({ message: 'Server error during export.' });
  }
};

export const scheduleDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.scheduledDeletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await user.save();
    return res.json({ message: 'Account scheduled for deletion in 30 days.', date: user.scheduledDeletionDate });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const cancelDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.scheduledDeletionDate = null;
    await user.save();
    return res.json({ message: 'Account deletion cancelled.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};
