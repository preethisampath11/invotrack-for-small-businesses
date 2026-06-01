import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Activity from '../models/Activity.js';

export const getClients = async (req, res) => {
  try {
    const clients = await Client.find({ companyId: req.user.companyId }).sort({ createdAt: -1 });

    const clientsWithStats = await Promise.all(clients.map(async (client) => {
      const invoices = await Invoice.find({ clientId: client._id, companyId: req.user.companyId });
      const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const outstanding = totalBilled - totalPaid;
      const invoiceCount = invoices.length;

      return {
        ...client.toObject(),
        totalBilled,
        totalPaid,
        outstanding,
        invoiceCount
      };
    }));

    return res.json({ clients: clientsWithStats });
  } catch (error) {
    console.error('Get clients error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const getClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const invoices = await Invoice.find({ clientId: client._id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ companyId: req.user.companyId, invoiceId: { $in: invoices.map(i => i._id) } });

    return res.json({ client, invoices, payments });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const createClient = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const client = await Client.create({
      companyId: req.user.companyId,
      name,
      email,
      phone,
      address
    });

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId,
        userId: req.user._id,
        userName: req.user.name,
        action: 'Created new client',
        entityType: 'client',
        entityId: client._id,
        details: `Added client "${client.name}"`
      });
      io.to(req.user.companyId.toString()).emit('clients:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    return res.status(201).json({ client });
  } catch (error) {
    console.error('Create client error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId,
        userId: req.user._id,
        userName: req.user.name,
        action: 'Updated client',
        entityType: 'client',
        entityId: client._id,
        details: `Updated client "${client.name}"`
      });
      io.to(req.user.companyId.toString()).emit('clients:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    return res.json({ client });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId,
        userId: req.user._id,
        userName: req.user.name,
        action: 'Deleted client',
        entityType: 'client',
        details: `Removed client "${client.name}"`
      });
      io.to(req.user.companyId.toString()).emit('clients:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    return res.json({ message: 'Client deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};
