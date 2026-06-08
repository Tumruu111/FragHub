import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../../generated/prisma/enums';
import { config } from '../config';
import { isTokenBlacklisted } from '../lib/tokenBlacklist';

export interface JwtPayload {
  id: string;
  role: Role;
  exp?: number;
}

export interface GraphQLContext {
  user: JwtPayload | null;
  token: string | null;
}

export const buildContext = async ({ req }: { req: Request }): Promise<GraphQLContext> => {
  const token = req.headers.authorization?.split(' ')[1] ?? null;
  if (!token) return { user: null, token: null };
  try {
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return { user: null, token: null };
    const payload = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    return { user: payload, token };
  } catch {
    return { user: null, token: null };
  }
};
