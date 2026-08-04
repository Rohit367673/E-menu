import { Router } from 'express';
import { generateQRCode, getQRInfo } from '../controllers/qrController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/info', auth, getQRInfo);
router.get('/download', auth, generateQRCode);

export default router;
