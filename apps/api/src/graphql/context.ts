import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../../generated/prisma/enums';
import { config } from '../config';

export interface JwtPayload {
  id: string;
  role: Role;
}

export interface GraphQLContext {
  user: JwtPayload | null;
}

export const buildContext = async ({ req }: { req: Request }): Promise<GraphQLContext> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return { user: null };
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    return { user: payload };
  } catch {
    return { user: null };
  }
};
