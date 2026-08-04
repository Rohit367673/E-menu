import { Response } from 'express';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import { AuthRequest } from '../middleware/auth.js';
import {
  formatAsRestaurant,
  getOrCreateRestaurant,
  findRestaurantBySlug,
} from '../utils/restaurant.js';

export const getRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurant = await getOrCreateRestaurant();
    res.json({
      success: true,
      data: { restaurant: formatAsRestaurant(restaurant) },
    });
  } catch (error) {
    console.error('GetRestaurant error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, logo, coverImage, slug } = req.body;
    const restaurant = await getOrCreateRestaurant();

    if (name !== undefined) restaurant.name = name;
    if (description !== undefined) restaurant.description = description;
    if (logo !== undefined) restaurant.logo = logo;
    if (coverImage !== undefined) restaurant.coverImage = coverImage;
    if (slug !== undefined) restaurant.slug = slug.toLowerCase().trim().replace(/\s+/g, '-');

    await restaurant.save();

    res.json({
      success: true,
      data: { restaurant: formatAsRestaurant(restaurant) },
      message: 'Restaurant profile updated successfully',
    });
  } catch (error) {
    console.error('UpdateRestaurant error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { templateConfig } = req.body;

    if (!templateConfig) {
      res.status(400).json({ success: false, message: 'templateConfig is required' });
      return;
    }

    const restaurant = await getOrCreateRestaurant();

    if (templateConfig.templateId !== undefined) {
      restaurant.theme = templateConfig.templateId;
    }
    if (templateConfig.colors !== undefined) {
      restaurant.colors = { ...restaurant.colors, ...templateConfig.colors };
    }
    if (templateConfig.fonts !== undefined) {
      restaurant.fonts = { ...restaurant.fonts, ...templateConfig.fonts };
    }

    await restaurant.save();

    res.json({
      success: true,
      data: { restaurant: formatAsRestaurant(restaurant) },
      message: 'Template configuration updated successfully',
    });
  } catch (error) {
    console.error('UpdateTemplate error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPublicMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const restaurant = await findRestaurantBySlug(slug);
    const restaurantId = restaurant._id;

    const categories = await Category.find({ restaurantId, isActive: { $ne: false } }).sort({
      sortOrder: 1,
    });
    const menuItems = await MenuItem.find({ restaurantId, available: true }).sort({ order: 1 });

    const mappedMenuItems = menuItems.map((item) => {
      const itemObj = item.toObject();
      return {
        ...itemObj,
        category: itemObj.categoryId ? itemObj.categoryId.toString() : '',
        isAvailable: itemObj.available,
        order: itemObj.order,
      };
    });

    const categoriesWithItems = categories.map((category) => {
      const catObj = category.toObject();
      return {
        ...catObj,
        order: catObj.sortOrder,
        isActive: catObj.isActive !== false,
        items: mappedMenuItems.filter(
          (item) => item.category === (category._id as { toString(): string }).toString()
        ),
      };
    });

    res.json({
      success: true,
      data: {
        restaurant: formatAsRestaurant(restaurant),
        categories: categoriesWithItems,
      },
    });
  } catch (error) {
    console.error('GetPublicMenu error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
