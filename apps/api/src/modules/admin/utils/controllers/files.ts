import type { Response } from 'express';
import { FileService } from '../services/file';

export const uploadFile = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      throw new Error('File is empty');
    }

    const key = await FileService.upload(req.file);

    res.json({ message: 'Success', data: key });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const readFile = async (req: any, res: Response) => {
  try {
    if (!req.params.file) {
      throw new Error('File is undefined');
    }

    const url = await FileService.getFile(req.params.file);

    res.send(url);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
