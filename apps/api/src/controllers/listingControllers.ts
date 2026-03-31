import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createList = async (req: Request, res: Response) => {
  const { title, vibe, status, size, picture } = req.body;
  const list = await prisma.listing.create({
    data: {
      title,
      vibe,
      status,
      size,
      picture,
    },
  });
  res.send({ message: 'List created successfully' });
  return list;
};
