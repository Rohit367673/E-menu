import { Response } from 'express';
import QRCode from 'qrcode';
import env from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';
import { getOrCreateRestaurant } from '../utils/restaurant.js';

export const generateQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurant = await getOrCreateRestaurant();
    const { format = 'png', size = 512, fgColor = '#1f2937', bgColor = '#ffffff' } = req.query;

    const menuUrl = `${env.APP_URL}/menu/${restaurant.slug}`;

    if (format === 'svg') {
      const svg = await QRCode.toString(menuUrl, {
        type: 'svg',
        width: Number(size),
        color: { dark: String(fgColor), light: String(bgColor) },
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${restaurant.slug}-qr.svg"`);
      res.send(svg);
      return;
    }

    const buffer = await QRCode.toBuffer(menuUrl, {
      type: 'png',
      width: Number(size),
      color: { dark: String(fgColor), light: String(bgColor) },
      margin: 2,
      errorCorrectionLevel: 'H',
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${restaurant.slug}-qr.png"`);
    res.send(buffer);
  } catch (error) {
    console.error('GenerateQRCode error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate QR code' });
  }
};

export const getQRInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurant = await getOrCreateRestaurant();
    const menuUrl = `${env.APP_URL}/menu/${restaurant.slug}`;

    res.json({
      success: true,
      data: {
        menuUrl,
        slug: restaurant.slug,
        restaurantName: restaurant.name,
      },
    });
  } catch (error) {
    console.error('GetQRInfo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
