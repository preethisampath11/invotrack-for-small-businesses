import express from 'express';
import multer from 'multer';
import path from 'path';
import { register, login, googleAuth, getMe, updateProfile, refreshAuth, logout } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../middleware/validate.js';

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter 
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google', googleAuth);
router.post('/refresh', refreshAuth);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, upload.single('avatar'), updateProfile);

export default router;
