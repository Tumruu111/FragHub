import { Router } from 'express';
import { createList, deleteList, getAllLists } from '../controllers/adminControllers';
import { adminAuthMiddleware } from '../authMiddleware';
import { adminLogin, adminRegister, adminLogout } from '../controllers/auth';
import { router as fileRoutes } from '../../files/routes/file';
import { authLimiter } from '../../../lib/rateLimits';

const router = Router();

router.post('/login', authLimiter, adminLogin);
router.post('/register', authLimiter, adminRegister);
router.post('/logout', adminAuthMiddleware, adminLogout);

router.get('/lists', adminAuthMiddleware, getAllLists);
router.post('/create', adminAuthMiddleware, createList);
router.delete('/delete/:id', adminAuthMiddleware, deleteList);
router.use('/files', adminAuthMiddleware, fileRoutes);

export default router;
