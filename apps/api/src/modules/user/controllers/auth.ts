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
  const { email, name, password, verifyPassword } = req.body;

  if (!email || !password || !name || !verifyPassword) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  if (password !== verifyPassword) {
    return res.status(400).send({ message: 'Passwords do not match' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return res.status(201).send({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).send({ message: 'Email already exists' });
    }

    return res.status(500).send({ message: 'Something went wrong' });
  }
};
