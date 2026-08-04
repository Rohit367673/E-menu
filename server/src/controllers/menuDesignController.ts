import { Response } from 'express';
import MenuDesign from '../models/MenuDesign.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import { AuthRequest } from '../middleware/auth.js';

// Helper to get or create the single MenuDesign document
const getOrCreateDesign = async () => {
  let design = await MenuDesign.findOne();
  if (!design) {
    design = new MenuDesign({
      theme: 'custom-canvas',
      colors: {
        primary: '#E65100',
        secondary: '#FF8A65',
        background: '#FFF8F0',
        surface: '#FFFFFF',
        text: '#1A1A1A',
        textSecondary: '#666666',
        accent: '#FF5722',
      },
      fonts: {
        heading: 'Outfit',
        body: 'Inter',
      },
      canvasData: '',
    });
    await design.save();
  }
  return design;
};

// Formats MenuDesign to client's expected Restaurant structure
const formatAsRestaurant = (design: any) => {
  return {
    _id: design._id,
    name: (design as any).name || 'Cafe Client',
    slug: 'menu',
    description: (design as any).description || 'Welcome to our cafe menu!',
    logo: (design as any).logo || '',
    coverImage: (design as any).coverImage || '',
    owner: 'admin',
    templateConfig: {
      templateId: design.theme,
      colors: design.colors,
      fonts: design.fonts,
      borderRadius: '12px',
      cardStyle: 'elevated',
      categoryStyle: 'tabs',
      shadows: true,
      canvasState: design.canvasData,
    },
    createdAt: design.createdAt,
    updatedAt: design.updatedAt,
  };
};

export const getRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const design = await getOrCreateDesign();
    res.json({
      success: true,
      data: { restaurant: formatAsRestaurant(design) },
    });
  } catch (error: any) {
    console.error('GetRestaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const updateRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, logo, coverImage } = req.body;
    const design = await getOrCreateDesign();

    if (name !== undefined) (design as any).name = name;
    if (description !== undefined) (design as any).description = description;
    if (logo !== undefined) (design as any).logo = logo;
    if (coverImage !== undefined) (design as any).coverImage = coverImage;

    await design.save();

    res.json({
      success: true,
      data: { restaurant: formatAsRestaurant(design) },
      message: 'Restaurant profile updated successfully',
    });
  } catch (error: any) {
    console.error('UpdateRestaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { templateConfig } = req.body;

    if (!templateConfig) {
      res.status(400).json({
        success: false,
        message: 'templateConfig is required',
      });
      return;
    }

    const design = await getOrCreateDesign();

    if (templateConfig.templateId !== undefined) {
      design.theme = templateConfig.templateId;
    }

    if (templateConfig.colors !== undefined) {
      design.colors = {
        ...design.colors,
        ...templateConfig.colors,
      };
    }

    if (templateConfig.fonts !== undefined) {
      design.fonts = {
        ...design.fonts,
        ...templateConfig.fonts,
      };
    }

    if (templateConfig.canvasState !== undefined) {
      design.canvasData = templateConfig.canvasState;
    }

    await design.save();

    res.json({
      success: true,
      data: { restaurant: formatAsRestaurant(design) },
      message: 'Template configuration updated successfully',
    });
  } catch (error: any) {
    console.error('UpdateTemplate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const getPublicMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const design = await getOrCreateDesign();

    // Query categories and menu items (no restaurant constraints!)
    const categories = await Category.find().sort({ sortOrder: 1 });
    const menuItems = await MenuItem.find({ available: true }).sort({ order: 1 });

    // Format menu items for client compatibility (mapping categoryId to category, available to isAvailable)
    const mappedMenuItems = menuItems.map((item) => {
      const itemObj = item.toObject();
      return {
        ...itemObj,
        category: itemObj.categoryId ? itemObj.categoryId.toString() : '',
        isAvailable: itemObj.available,
      };
    });

    const categoriesWithItems = categories.map((category) => ({
      ...category.toObject(),
      items: mappedMenuItems.filter(
        (item) => item.category === (category._id as any).toString()
      ),
    }));

    res.json({
      success: true,
      data: {
        restaurant: formatAsRestaurant(design),
        categories: categoriesWithItems,
      },
    });
  } catch (error: any) {
    console.error('GetPublicMenu error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
