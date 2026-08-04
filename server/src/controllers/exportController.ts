import { Response } from 'express';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import { AuthRequest } from '../middleware/auth.js';
import { getOrCreateRestaurant } from '../utils/restaurant.js';
import env from '../config/env.js';
import {
  renderExportHtml,
  generatePdf,
  generatePng,
  type ExportTemplateId,
} from '../services/exportService.js';

const VALID_TEMPLATES: ExportTemplateId[] = ['modern-cafe', 'dark-restaurant', 'classic-menu'];

const getAbsoluteUrl = (path: string | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  return `http://localhost:${env.PORT}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const exportMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { template, format } = req.body as { template?: string; format?: string };

    if (!template || !VALID_TEMPLATES.includes(template as ExportTemplateId)) {
      res.status(400).json({
        success: false,
        message: 'Valid template is required: modern-cafe, dark-restaurant, or classic-menu',
      });
      return;
    }

    if (!format || !['pdf', 'png'].includes(format)) {
      res.status(400).json({ success: false, message: 'Format must be pdf or png' });
      return;
    }

    const restaurant = await getOrCreateRestaurant();
    const restaurantId = restaurant._id;

    const categories = await Category.find({ restaurantId, isActive: { $ne: false } }).sort({
      sortOrder: 1,
    });
    const menuItems = await MenuItem.find({ restaurantId, available: true }).sort({ order: 1 });

    const exportData = {
      restaurant: {
        name: restaurant.name,
        logo: getAbsoluteUrl(restaurant.logo),
        description: restaurant.description,
      },
      categories: categories.map((cat) => ({
        name: cat.name,
        items: menuItems
          .filter((item) => item.categoryId.toString() === cat._id.toString())
          .map((item) => ({
            name: item.name,
            description: item.description,
            price: item.price,
            image: getAbsoluteUrl(item.image),
          })),
      })),
    };

    const html = renderExportHtml(template as ExportTemplateId, exportData);
    const filename = `${restaurant.slug || 'menu'}-${template}`;

    if (format === 'pdf') {
      const buffer = await generatePdf(html);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.send(buffer);
      return;
    }

    const buffer = await generatePng(html);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.png"`);
    res.send(buffer);
  } catch (error) {
    console.error('ExportMenu error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
};
