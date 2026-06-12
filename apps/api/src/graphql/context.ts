import type { Request } from 'express';
import { getBearerToken, verifyToken, type JwtPayload } from '../lib/auth';

export type { JwtPayload };

export interface GraphQLContext {
  user: JwtPayload | null;
  token: string | null;
}

export const buildContext = async ({ req }: { req: Request }): Promise<GraphQLContext> => {
  const token = getBearerToken(req);
  if (!token) return { user: null, token: null };
  const user = await verifyToken(token);
  return user ? { user, token } : { user: null, token: null };
};
