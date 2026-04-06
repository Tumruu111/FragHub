import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getSecret } from '../../utils/utils';

export const adminAuthMiddleware = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  const token = authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send({ message: 'Unauthorized' });
  }

  const JWT_SECRET = getSecret();

  try {
    const tokenData = jwt.verify(token, JWT_SECRET) as { role: string };

    req.role = tokenData.role;
  } catch (e) {
    return res.status(401).send({ message: 'Invalid token' });
  }

  return next();
};
