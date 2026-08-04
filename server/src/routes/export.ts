import { Router } from 'express';
import { exportMenu } from '../controllers/exportController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.post('/menu', auth, exportMenu);

export default router;
