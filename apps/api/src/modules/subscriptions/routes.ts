import { Router } from 'express';
import { checkSubscriptionInvoice, payInvoice, subscribe } from './controllers';
import { apiLimiter } from '../../lib/rateLimits';

// Signing up and paying are REST, like checkout. Viewing and cancelling a
// subscription, and everything the admin does, are GraphQL.
const router = Router();

router.post('/', apiLimiter, subscribe);
router.post('/invoices/:id/pay', apiLimiter, payInvoice);
router.get('/invoices/:id/check', apiLimiter, checkSubscriptionInvoice);

export default router;
