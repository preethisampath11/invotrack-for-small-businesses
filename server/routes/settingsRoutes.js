import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getSettings,
  updateSettings,
  uploadLogo,
  logoutAll,
  exportData,
  scheduleDeletion,
  cancelDeletion
} from '../controllers/settingsController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', verifyToken, getSettings);
router.put('/', verifyToken, verifyAdmin, updateSettings);
router.post('/logo', verifyToken, verifyAdmin, upload.single('logo'), uploadLogo);

// Security endpoints (admin only for now, or just verifyToken?)
// Technically any user could have preferences/security, but the app is admin-heavy. 
// We will allow verifyToken so staff can potentially logout all.
router.post('/security/logout-all', verifyToken, logoutAll);
router.get('/security/export', verifyToken, verifyAdmin, exportData);
router.post('/security/delete', verifyToken, verifyAdmin, scheduleDeletion);
router.post('/security/cancel-delete', verifyToken, verifyAdmin, cancelDeletion);

export default router;
