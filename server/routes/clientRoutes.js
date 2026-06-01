import express from 'express';
import { getClients, getClient, createClient, updateClient, deleteClient } from '../controllers/clientController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);
router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', verifyAdmin, createClient);
router.put('/:id', verifyAdmin, updateClient);
router.delete('/:id', verifyAdmin, deleteClient);

export default router;
