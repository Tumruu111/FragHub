import { Router } from 'express';
import { adminAuthMiddleware } from '../authMiddleware';
import { adminLogin, adminRegister, adminLogout } from '../controllers/auth';
import { router as fileRoutes } from '../../files/routes/file';
import { authLimiter } from '../../../lib/rateLimits';

// Listings are managed through GraphQL (adminListings, createListing,
// updateListing, deleteListing). REST keeps auth and file uploads.
const router = Router();

router.post('/login', authLimiter, adminLogin);
router.post('/register', authLimiter, adminRegister);
router.post('/logout', adminAuthMiddleware, adminLogout);

router.use('/files', adminAuthMiddleware, fileRoutes);

export default router;
