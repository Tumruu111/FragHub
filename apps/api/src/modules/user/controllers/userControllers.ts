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
export const getAllLists = async (req: Request, res: Response) => {
  try {
    const lists = await prisma.listing.findMany();
    return res.send({
      message: 'Lists retrieved successfully',
      data: lists,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).send({
      message: 'Failed to retrieve listings',
      error,
    });
  }
};
