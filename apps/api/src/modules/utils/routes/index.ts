import { Router } from 'express';
import { router as fileRoutes } from './file';

export const utilsRouter = Router();

utilsRouter.use('/file', fileRoutes);
