import { Router } from 'express';
import { orderProduct } from '../controllers/userControllers';
import { login, register } from '../controllers/auth';
import { authMiddleware } from '../authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/order', authMiddleware, orderProduct);

export default router;
