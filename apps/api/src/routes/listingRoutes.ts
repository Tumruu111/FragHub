import { Router } from 'express';
import { createList } from '../controllers/listingControllers';

const router = Router();

router.post('/create', createList);

export default router;
