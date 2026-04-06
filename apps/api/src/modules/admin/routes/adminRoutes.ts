import { Router } from 'express';
import {
  createList,
  deleteList,
  getAllLists,
} from '../controllers/adminControllers';
import { adminAuthMiddleware } from '../authMiddleware';

const router = Router();

router.post('/create', adminAuthMiddleware, createList);
router.get('/lists', getAllLists);
router.delete('/delete/:id', adminAuthMiddleware, deleteList);

export default router;
