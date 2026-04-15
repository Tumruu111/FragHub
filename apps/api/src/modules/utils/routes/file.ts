import { Router } from 'express';
import { uploadFile, readFile } from '../controllers/file';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WEBP allowed'));
  },
});

export const router = Router();

router.post('/upload-file', upload.single('file'), uploadFile);
router.get('/read-file/:file', readFile);
