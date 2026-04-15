import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

  const token = jwt.sign(
    { id: admin.id, role: admin.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  return res.send({
    message: 'Logged in as Admin',
    token,
  });
};
export const adminRegister = async (req: Request, res: Response) => {
  const { email, name, password, secret } = req.body;
  console.log('BODY RECEIVED:', req.body);
  if (secret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).send({ message: 'Unauthorized to register admin' });
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    return res.status(400).send({ message: 'Admin already exists' });
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
