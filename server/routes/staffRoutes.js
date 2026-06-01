import express from 'express';
import { getStaff, createInvitation, updateStaffStatus, updateStaffPermissions, deleteStaff } from '../controllers/staffController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, verifyAdmin);
router.get('/', getStaff);
router.post('/invite', createInvitation);
router.put('/:id/status', updateStaffStatus);
router.put('/:id/permissions', updateStaffPermissions);
router.delete('/:id', deleteStaff);

export default router;
