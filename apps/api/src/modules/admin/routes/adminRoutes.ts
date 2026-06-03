import { Router } from 'express';
import { createList, deleteList, getAllLists } from '../controllers/adminControllers';
import { adminAuthMiddleware } from '../authMiddleware';
import { adminLogin, adminRegister } from '../controllers/auth';
import { router as fileRoutes } from '../../utils/routes/file';

const router = Router();

// Auth (public)
router.post('/login', adminLogin);
router.post('/register', adminRegister);

// Listings (protected)
router.get('/lists', adminAuthMiddleware, getAllLists);
router.post('/create', adminAuthMiddleware, createList);
router.delete('/delete/:id', adminAuthMiddleware, deleteList);

// File uploads (protected)
router.use('/files', adminAuthMiddleware, fileRoutes);

export default router;
