import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';

export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const admin = await prisma.user.findUnique({
    where: { email },
  });

  if (
    !admin ||
    admin.role !== 'Admin' ||
    !(await bcrypt.compare(password, admin.password))
  ) {
    return res.status(401).send({ message: 'Invalid credentials' });
  }

  return res.send({ message: 'Admin login successful' });
};
