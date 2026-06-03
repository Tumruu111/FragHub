import { Router } from 'express';
import multer from 'multer';
import { uploadFile, readFile } from '../controllers/file';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WEBP are allowed'));
  },
});

export const router = Router();

router.post('/upload', upload.single('file'), uploadFile);
router.get('/:file', readFile);
