import { Router } from 'express';
import { createPayment, checkPayment, cancelPayment, paymentCallback } from './controllers';
import { apiLimiter } from '../../lib/rateLimits';

const router = Router();

router.post('/create', apiLimiter, createPayment);
router.get('/:id/check', apiLimiter, checkPayment);
router.delete('/:id', apiLimiter, cancelPayment);
router.post('/callback', paymentCallback);
router.get('/callback', paymentCallback);

export default router;
