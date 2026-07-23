import { prisma } from './prisma';
import { logger } from './logger';

export const blacklistToken = async (token: string, expiresAt: Date) => {
  try {
    await prisma.tokenBlacklist.upsert({
      where: { token },
      update: {},
      create: { token, expiresAt },
    });
  } catch (err) {
    logger.error('Failed to blacklist token', err);
  }
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const entry = await prisma.tokenBlacklist.findUnique({ where: { token } });
    return !!entry;
  } catch {
    return false;
  }
};

export const purgeExpiredTokens = async () => {
  try {
    const { count } = await prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) logger.info('Purged expired tokens', { count });
  } catch (err) {
    logger.error('Failed to purge expired tokens', err);
  }
};
