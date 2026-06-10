import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { config } from '../../config';
import { blacklistToken } from '../../lib/tokenBlacklist';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '../../../generated/prisma/enums';

// ── Register ────────────────────────────────────────────────────────────────
export const userRegister = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, config.auth.bcryptRounds);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: Role.User },
    });

    logger.info('User registered', { userId: user.id });
    return res.status(201).json({ message: 'Account created successfully', id: user.id });
  } catch (err) {
    logger.error('userRegister failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ── Login ───────────────────────────────────────────────────────────────────
export const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiresIn }
    );

    logger.info('User login', { userId: user.id });
    return res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    logger.error('userLogin failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ── Logout ──────────────────────────────────────────────────────────────────
export const userLogout = async (req: Request, res: Response) => {
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
    logger.info('User logout');
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('userLogout failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
