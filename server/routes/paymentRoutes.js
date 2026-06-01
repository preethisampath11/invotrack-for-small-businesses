import express from 'express';
import { getPayments, createPayment, deletePayment } from '../controllers/paymentController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);
router.get('/', getPayments);
router.post('/', verifyAdmin, createPayment);
router.delete('/:id', verifyAdmin, deletePayment);

export default router;
