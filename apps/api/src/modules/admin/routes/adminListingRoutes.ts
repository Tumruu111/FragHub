import { Router } from 'express';
import { createList } from '../controllers/adminListingControllers';

const router = Router();

router.post('/create', createList);

export default router;
