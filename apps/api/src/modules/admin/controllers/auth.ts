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

  return res.send({ message: 'Logged in as Admin' });
};
export const adminRegister = async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    return res
      .status(400)
      .send({ message: 'Admin with this email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'Admin',
    },
  });

  return res.send({
    message: 'Admin registered successfully',
    adminId: newAdmin.id,
  });
};
