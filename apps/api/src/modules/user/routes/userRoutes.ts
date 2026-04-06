import { Router } from 'express';
import { getAllLists, orderProduct } from '../controllers/userControllers';
import { login, register } from '../controllers/auth';
import { authMiddleware } from '../authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/order', authMiddleware, orderProduct);
router.get('/lists', authMiddleware, getAllLists);

export default router;
