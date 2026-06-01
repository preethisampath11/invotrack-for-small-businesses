import Item from '../models/Item.js';
import Activity from '../models/Activity.js';

export const getItems = async (req, res) => {
  try {
    const items = await Item.find({ companyId: req.user.companyId }).sort({ createdAt: -1 });
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const getItem = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    return res.json({ item });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const createItem = async (req, res) => {
  try {
    const { name, sku, description, unitPrice, stock, isService } = req.body;
    const item = await Item.create({
      companyId: req.user.companyId, name, sku, description, unitPrice,
      stock: isService ? null : (stock || 0),
      isService: isService || false
    });

    const io = req.app.get('io');
    if (io) {
      const isStaff = req.user.role === 'staff';
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Created new item', entityType: 'item', entityId: item._id,
        details: `Added item "${item.name}" (${isService ? 'Service' : `Stock: ${stock || 0}`})`,
        isAlert: isStaff
      });
      io.to(req.user.companyId.toString()).emit('inventory:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
      if (isStaff) {
        io.to(req.user.companyId.toString()).emit('alert:inventory', {
          message: `Staff ${req.user.name} created new item "${item.name}"`, userId: req.user._id
        });
      }
    }
    return res.status(201).json({ item });
  } catch (error) {
    console.error('Create item error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const updateItem = async (req, res) => {
  try {
    const oldItem = await Item.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!oldItem) return res.status(404).json({ message: 'Item not found.' });

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      req.body, { new: true, runValidators: true }
    );

    const io = req.app.get('io');
    if (io) {
      const isStaff = req.user.role === 'staff';
      const changes = [];
      if (oldItem.name !== item.name) changes.push(`name: "${oldItem.name}" → "${item.name}"`);
      if (oldItem.unitPrice !== item.unitPrice) changes.push(`price: ${oldItem.unitPrice} → ${item.unitPrice}`);
      if (oldItem.stock !== item.stock) changes.push(`stock: ${oldItem.stock} → ${item.stock}`);

      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Updated item', entityType: 'item', entityId: item._id,
        details: `Updated "${item.name}"${changes.length ? ` (${changes.join(', ')})` : ''}`,
        isAlert: isStaff
      });
      io.to(req.user.companyId.toString()).emit('inventory:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
      if (isStaff) {
        io.to(req.user.companyId.toString()).emit('alert:inventory', {
          message: `Staff ${req.user.name} updated item "${item.name}"${changes.length ? ` — ${changes.join(', ')}` : ''}`,
          userId: req.user._id
        });
      }
    }
    return res.json({ item });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Deleted item', entityType: 'item',
        details: `Removed item "${item.name}"`
      });
      io.to(req.user.companyId.toString()).emit('inventory:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }
    return res.json({ message: 'Item deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};
