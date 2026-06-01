import express from 'express';
import { getItems, getItem, createItem, updateItem, deleteItem } from '../controllers/itemController.js';
import { verifyToken, verifyInventoryAccess } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);
router.get('/', getItems);
router.get('/:id', getItem);
router.post('/', verifyInventoryAccess, createItem);
router.put('/:id', verifyInventoryAccess, updateItem);
router.delete('/:id', verifyInventoryAccess, deleteItem);

export default router;
