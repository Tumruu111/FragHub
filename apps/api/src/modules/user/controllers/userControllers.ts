import { prisma } from '../../../lib/prisma';
import { Request, Response } from 'express';

export const orderProduct = async (req: Request, res: Response) => {
  const { userId, listingId } = req.body;

  try {
    const order = await prisma.order.create({
      data: {
        userId,
        listingId,
      },
    });
    res.send({ message: 'Product ordered successfully', data: order });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to order product', error });
  }
};
