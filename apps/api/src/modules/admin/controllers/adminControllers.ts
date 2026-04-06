import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';

export const createList = async (req: Request, res: Response) => {
  try {
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

    return res.send({
      message: 'List created successfully',
      data: list,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).send({
      message: 'Failed to create listing',
      error,
    });
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
export const deleteList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.listing.delete({
      where: { id },
    });

    return res.send({
      message: 'List deleted successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(400).send({
      message: 'Failed to delete listing',
      error,
    });
  }
};
