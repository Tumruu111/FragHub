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

// Extract the bearer token from the Authorization header. Returns null if missing or wrong scheme.
export const getBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length) || null;
};

// Verify a JWT. Returns null for invalid, expired, revoked, or malformed tokens.
export const verifyToken = async (token: string): Promise<JwtPayload | null> => {
  try {
    if (await isTokenBlacklisted(token)) return null;
    const payload = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    if (typeof payload?.id !== 'string' || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
};

// Extract and verify the bearer token from a request. Returns null if missing/invalid/revoked.
export const getUserFromRequest = async (req: Request): Promise<JwtPayload | null> => {
  const token = getBearerToken(req);
  if (!token) return null;
  return verifyToken(token);
};
