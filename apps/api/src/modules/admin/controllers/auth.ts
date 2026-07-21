import { blacklistToken } from '../../../lib/tokenBlacklist';
import type { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';
import { config } from '../../../config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '../../../../generated/prisma/enums';
import { validateRegistration } from '../../../lib/validation';

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    const admin = await prisma.user.findUnique({ where: { email } });
    if (!admin || admin.role !== Role.Admin)
      return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiresIn }
    );
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
    if (!secret)
      return res.status(400).json({ message: 'All fields are required' });
    if (secret !== config.auth.adminSecretKey)
      return res.status(403).json({ message: 'Invalid secret key' });
    const validationError = validateRegistration({ name, email, password });
    if (validationError)
      return res.status(400).json({ message: validationError });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ message: 'Email already in use' });
    const hashedPassword = await bcrypt.hash(
      password,
      config.auth.bcryptRounds
    );
    const admin = await prisma.user.create({
      data: { email, name, password: hashedPassword, role: Role.Admin },
    });
    logger.info('Admin registered', { adminId: admin.id });
    return res
      .status(201)
      .json({ message: 'Admin registered successfully', id: admin.id });
  } catch (err) {
    logger.error('adminRegister failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminLogout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(400).json({ message: 'No token provided' });

    let decoded: { exp?: number };
    try {
      decoded = jwt.verify(token, config.auth.jwtSecret) as { exp?: number };
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const expiresAt = decoded.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await blacklistToken(token, expiresAt);
    logger.info('Admin logout');
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('adminLogout failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
