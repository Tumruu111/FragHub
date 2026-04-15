import { Router } from 'express';
import { router as fileRoutes } from './files';

export const utilsRouter = Router();

utilsRouter.use('/file', fileRoutes);
