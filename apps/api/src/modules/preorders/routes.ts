import { Router } from 'express';
import {
  checkPreorderPayment,
  payPreorderPayment,
  placePreorder,
} from './controllers';
import { apiLimiter } from '../../lib/rateLimits';

// Placing and paying are REST, like subscriptions. Viewing pre-orders, and
// everything the admin does, are GraphQL.
const router = Router();

router.post('/', apiLimiter, placePreorder);
router.post('/payments/:id/pay', apiLimiter, payPreorderPayment);
router.get('/payments/:id/check', apiLimiter, checkPreorderPayment);

export default router;
