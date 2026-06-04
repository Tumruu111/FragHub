import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../../../generated/prisma/enums';
import { config } from '../../config';

interface JwtPayload { id: string; role: Role; }

export interface AuthRequest extends Request { user?: JwtPayload; }

export const adminAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    if (payload.role !== Role.Admin) return res.status(403).json({ message: 'Forbidden: Admins only' });
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
