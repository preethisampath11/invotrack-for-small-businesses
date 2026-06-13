import express from 'express';
import { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, getDashboardStats, sendInvoiceEmail, downloadInvoicePdf } from '../controllers/invoiceController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import { validate, invoiceSchema } from '../middleware/validate.js';

const router = express.Router();

router.use(verifyToken);
router.get('/dashboard', getDashboardStats);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.get('/:id/pdf', downloadInvoicePdf);
router.post('/', verifyAdmin, validate(invoiceSchema), createInvoice);
router.put('/:id', verifyAdmin, updateInvoice);
router.delete('/:id', verifyAdmin, deleteInvoice);
router.post('/:id/send', verifyAdmin, sendInvoiceEmail);

export default router;
