import { Router } from 'express';
import {
  createList,
  deleteList,
  getAllLists,
} from '../controllers/adminControllers';
import { adminAuthMiddleware } from '../authMiddleware';
import { adminLogin, adminRegister } from '../controllers/auth';

const router = Router();

router.post('/create', adminAuthMiddleware, createList);
router.post('/login', adminLogin);
router.post('/register', adminRegister);
router.get('/lists', getAllLists);
router.delete('/delete/:id', adminAuthMiddleware, deleteList);

export default router;
