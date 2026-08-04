import { Router } from 'express';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

router.post('/image', auth, upload.single('image'), uploadImage);

router.delete('/image', auth, deleteImage);

export default router;
