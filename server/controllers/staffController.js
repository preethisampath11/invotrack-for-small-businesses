import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import Activity from '../models/Activity.js';

export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ companyId: req.user.companyId, role: 'staff' })
      .select('-passwordHash').sort({ createdAt: -1 });
    const invitations = await Invitation.find({ companyId: req.user.companyId })
      .sort({ createdAt: -1 });
    return res.json({ staff, invitations });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const createInvitation = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const existing = await User.findOne({ email: email.toLowerCase(), companyId: req.user.companyId });
    if (existing) return res.status(400).json({ message: 'This email is already a team member.' });

    const pendingInvite = await Invitation.findOne({
      email: email.toLowerCase(), companyId: req.user.companyId, status: 'pending'
    });
    if (pendingInvite) {
      return res.status(400).json({ message: 'An active invitation already exists for this email.' });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      email: email.toLowerCase(), companyId: req.user.companyId,
      invitedBy: req.user._id, token, expiresAt
    });

    const inviteLink = `${process.env.CLIENT_URL}/auth?token=${token}`;

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Sent staff invitation', entityType: 'staff', entityId: invitation._id,
        details: `Invited ${email} to join the team`
      });
      io.to(req.user.companyId.toString()).emit('staff:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    return res.status(201).json({ invitation, inviteLink });
  } catch (error) {
    console.error('Create invitation error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const updateStaffStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'pending', 'deactivated'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const staffMember = await User.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId, role: 'staff' },
      { status }, { new: true }
    ).select('-passwordHash');

    if (!staffMember) return res.status(404).json({ message: 'Staff member not found.' });

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: `${status === 'active' ? 'Approved' : 'Updated status of'} staff member`,
        entityType: 'staff', entityId: staffMember._id,
        details: `Set ${staffMember.name}'s status to ${status}`
      });
      io.to(req.user.companyId.toString()).emit('staff:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    return res.json({ staff: staffMember });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const updateStaffPermissions = async (req, res) => {
  try {
    const { canEditInventory } = req.body;
    const staffMember = await User.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId, role: 'staff' },
      { canEditInventory }, { new: true }
    ).select('-passwordHash');

    if (!staffMember) return res.status(404).json({ message: 'Staff member not found.' });

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Updated staff permissions', entityType: 'staff', entityId: staffMember._id,
        details: `${canEditInventory ? 'Granted' : 'Revoked'} inventory edit access for ${staffMember.name}`
      });
      io.to(req.user.companyId.toString()).emit('staff:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    return res.json({ staff: staffMember });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const staffMember = await User.findOneAndDelete({
      _id: req.params.id, companyId: req.user.companyId, role: 'staff'
    });
    if (!staffMember) return res.status(404).json({ message: 'Staff member not found.' });

    const io = req.app.get('io');
    if (io) {
      await Activity.create({
        companyId: req.user.companyId, userId: req.user._id, userName: req.user.name,
        action: 'Removed staff member', entityType: 'staff',
        details: `Removed ${staffMember.name} from the team`
      });
      io.to(req.user.companyId.toString()).emit('staff:updated');
      io.to(req.user.companyId.toString()).emit('activity:new');
    }

    return res.json({ message: 'Staff member removed.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};
