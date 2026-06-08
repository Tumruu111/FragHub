import { Router } from 'express';
import { userLogin, userLogout, userRegister } from './controllers';
import { authLimiter } from '../../lib/rateLimits';

const router = Router();

router.post('/register', authLimiter, userRegister);
router.post('/login', authLimiter, userLogin);
router.post('/logout', userLogout);

export default router;
