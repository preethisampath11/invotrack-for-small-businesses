import express from 'express';
import { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, getDashboardStats } from '../controllers/invoiceController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);
router.get('/dashboard', getDashboardStats);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', verifyAdmin, createInvoice);
router.put('/:id', verifyAdmin, updateInvoice);
router.delete('/:id', verifyAdmin, deleteInvoice);

export default router;
