import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../../generated/prisma/enums';
import { config } from '../config';
import { isTokenBlacklisted } from './tokenBlacklist';

export interface JwtPayload {
  id: string;
  role: Role;
  exp?: number;
}

export const getBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length) || null;
};

export const verifyToken = async (
  token: string
): Promise<JwtPayload | null> => {
  try {
    if (await isTokenBlacklisted(token)) return null;
    const payload = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    if (typeof payload?.id !== 'string' || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
};

export const getUserFromRequest = async (
  req: Request
): Promise<JwtPayload | null> => {
  const token = getBearerToken(req);
  if (!token) return null;
  return verifyToken(token);
};
