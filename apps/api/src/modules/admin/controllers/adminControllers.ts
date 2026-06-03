import type { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';

export const getAllLists = async (_req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ data: listings });
  } catch (err) {
    logger.error('getAllLists failed', err);
    return res.status(500).json({ message: 'Failed to retrieve listings' });
  }
};

export const createList = async (req: Request, res: Response) => {
  try {
    const { title, vibe, status, size, picture, price } = req.body;

    if (!title || !size || !picture || price === undefined) {
      return res.status(400).json({ message: 'title, size, picture, and price are required' });
    }

    const listing = await prisma.listing.create({
      data: { title, vibe, status, size, picture, price },
    });

    logger.info('Listing created', { listingId: listing.id });
    return res.status(201).json({ message: 'Listing created', data: listing });
  } catch (err) {
    logger.error('createList failed', err);
    return res.status(500).json({ message: 'Failed to create listing' });
  }
};

export const deleteList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    await prisma.listing.delete({ where: { id } });
    logger.info('Listing deleted', { listingId: id });
    return res.json({ message: 'Listing deleted' });
  } catch (err) {
    logger.error('deleteList failed', err);
    return res.status(500).json({ message: 'Failed to delete listing' });
  }
};
