import type { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '../../../../generated/prisma/enums';

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await prisma.user.findUnique({ where: { email } });

    if (!admin || admin.role !== Role.Admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      logger.error('JWT_SECRET is not set');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    logger.info('Admin login', { adminId: admin.id });
    return res.json({ message: 'Logged in successfully', token });
  } catch (err) {
    logger.error('adminLogin failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminRegister = async (req: Request, res: Response) => {
  try {
    const { email, name, password, secret } = req.body;

    if (!email || !name || !password || !secret) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (secret !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Invalid secret key' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: { email, name, password: hashedPassword, role: Role.Admin },
    });

    logger.info('Admin registered', { adminId: admin.id });
    return res.status(201).json({ message: 'Admin registered successfully', id: admin.id });
  } catch (err) {
    logger.error('adminRegister failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
