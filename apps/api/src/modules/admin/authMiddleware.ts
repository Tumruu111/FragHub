import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSecret } from '../../utils/utils';
import { Role } from '../../../generated/prisma/enums';

interface JwtPayload {
  role: Role;
}

interface AuthRequest extends Request {
  user?: {
    role: Role;
  };
}

export const adminAuthMiddleware = (
  req: AuthRequest,
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
    const tokenData = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = {
      role: tokenData.role,
    };

    if (tokenData.role !== Role.Admin) {
      return res.status(403).send({ message: 'Forbidden: Admins only' });
    }

    return next();
  } catch (e) {
    return res.status(401).send({ message: 'Invalid token' });
  }
};
