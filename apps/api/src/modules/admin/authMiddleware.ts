import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../../../generated/prisma/enums';
import { config } from '../../config';
import { isTokenBlacklisted } from '../../lib/tokenBlacklist';

interface JwtPayload { id: string; role: Role; }
export interface AuthRequest extends Request { user?: JwtPayload; }

export const adminAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return res.status(401).json({ message: 'Token has been revoked' });

    const payload = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    if (payload.role !== Role.Admin) return res.status(403).json({ message: 'Forbidden: Admins only' });

    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
