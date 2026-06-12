import type { Request, Response, NextFunction } from 'express';
import { Role } from '../../../generated/prisma/enums';
import { getUserFromRequest, type JwtPayload } from '../../lib/auth';

export interface AuthRequest extends Request { user?: JwtPayload; }

export const adminAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== Role.Admin) return res.status(403).json({ message: 'Forbidden: Admins only' });

  req.user = user;
  return next();
};
