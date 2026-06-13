import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { connectGmail, callbackGmail, disconnectGmail } from '../controllers/gmailController.js';

const router = express.Router();

// The /connect route is accessed via window.location.href, so headers aren't sent.
// We'll verify the token inside the connectGmail controller using req.query.token.
router.get('/connect', connectGmail);
router.get('/callback', callbackGmail);
router.post('/disconnect', verifyToken, disconnectGmail); // Accessed via axios, headers are sent

export default router;
