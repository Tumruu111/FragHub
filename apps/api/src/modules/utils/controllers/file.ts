import type { Request, Response } from 'express';
import { FileService } from '../services/file';
import { logger } from '../../../lib/logger';

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const key = await FileService.upload(req.file);
    logger.info('File uploaded', { key });
    return res.json({ message: 'Upload successful', data: key });
  } catch (err) {
    logger.error('uploadFile failed', err);
    return res.status(400).json({ message: 'Upload failed' });
  }
};

export const readFile = async (req: Request, res: Response) => {
  try {
    const { file } = req.params;
    if (!file) {
      return res.status(400).json({ message: 'File key is required' });
    }

    const url = await FileService.getFile(file);
    return res.json({ url });
  } catch (err) {
    logger.error('readFile failed', err);
    return res.status(400).json({ message: 'Could not retrieve file' });
  }
};
