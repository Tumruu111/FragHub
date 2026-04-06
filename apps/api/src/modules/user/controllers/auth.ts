import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send({ message: 'Invalid credentials' });
  }

  return res.send({ message: 'Login successful' });
};
export const register = async (req: Request, res: Response) => {
  const { email, password, name, verifyPassword } = req.body;
  if (password !== verifyPassword) {
    return res.status(400).send({ message: 'Passwords do not match' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });
  res.send({ message: 'User registered successfully' });
  return user;
};
