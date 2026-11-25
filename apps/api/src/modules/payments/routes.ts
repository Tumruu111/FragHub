import { Router } from 'express';
import { paymentCallback } from './controllers';

// The QPay callback, for pre-order payments and subscription months alike
const router = Router();

router.post('/callback', paymentCallback);
router.get('/callback', paymentCallback);

export default router;
