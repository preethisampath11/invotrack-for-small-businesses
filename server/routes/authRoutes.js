import express from 'express';
import multer from 'multer';
import path from 'path';
import { register, login, googleAuth, getMe, updateProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, upload.single('avatar'), updateProfile);

export default router;
