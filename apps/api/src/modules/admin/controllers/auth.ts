import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '../../../../generated/prisma/client';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ message: 'Email and password required' });
    }

    const admin = await prisma.user.findUnique({
      where: { email },
    });

    if (
      !admin ||
      admin.role !== Role.Admin ||
      !(await bcrypt.compare(password, admin.password))
    ) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
    console.log('Admin authenticated successfully:', admin.email);

    const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.send({
      message: 'Logged in as Admin',
      token,
    });
  } catch {
    return res.status(500).send({ message: 'Internal server error' });
  }
};

export const adminRegister = async (req: Request, res: Response) => {
  try {
    const { email, name, password, secret } = req.body;

    if (!email || !name || !password || !secret) {
      return res.status(400).send({ message: 'All fields are required' });
    }

    if (secret !== process.env.ADMIN_SECRET_KEY) {
      return res
        .status(403)
        .send({ message: 'Unauthorized to register admin' });
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
        role: Role.Admin,
      },
    });

    return res.send({
      message: 'Admin registered successfully',
      adminId: newAdmin.id,
    });
  } catch {
    return res.status(500).send({ message: 'Internal server error' });
  }
};
