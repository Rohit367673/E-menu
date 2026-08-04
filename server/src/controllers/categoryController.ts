import { Response } from 'express';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import { AuthRequest } from '../middleware/auth.js';
import { getOrCreateRestaurant } from '../utils/restaurant.js';

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurant = await getOrCreateRestaurant();
    const categories = await Category.find({ restaurantId: restaurant._id }).sort({ sortOrder: 1 });
    const mappedCats = categories.map((c) => {
      const obj = c.toObject();
      return { ...obj, order: obj.sortOrder, isActive: obj.isActive !== false };
    });

    res.json({
      success: true,
      data: { categories: mappedCats },
    });
  } catch (error: any) {
    console.error('GetCategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
      return;
    }

    const restaurant = await getOrCreateRestaurant();

    const maxOrderCategory = await Category.findOne({ restaurantId: restaurant._id })
      .sort({ sortOrder: -1 })
      .select('sortOrder');

    const sortOrder = maxOrderCategory ? maxOrderCategory.sortOrder + 1 : 0;

    const category = new Category({
      restaurantId: restaurant._id,
      name: name.trim(),
      sortOrder,
      isActive: true,
      printSketch: req.body.printSketch || '',
    });

    await category.save();

    const resultObj = category.toObject();
    const mappedCat = {
      ...resultObj,
      order: resultObj.sortOrder,
    };

    res.status(201).json({
      success: true,
      data: { category: mappedCat },
      message: 'Category created successfully',
    });
  } catch (error: any) {
    console.error('CreateCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, printSketch } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    if (name !== undefined) category.name = name.trim();
    if (printSketch !== undefined) category.printSketch = printSketch;

    await category.save();

    const resultObj = category.toObject();
    const mappedCat = {
      ...resultObj,
      order: resultObj.sortOrder,
    };

    res.json({
      success: true,
      data: { category: mappedCat },
      message: 'Category updated successfully',
    });
  } catch (error: any) {
    console.error('UpdateCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    // Delete all menu items in this category
    await MenuItem.deleteMany({
      categoryId: id,
    });

    await Category.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Category and its items deleted successfully',
    });
  } catch (error: any) {
    console.error('DeleteCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const reorderCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let orderedIds = req.body.orderedIds;
    if (!orderedIds && Array.isArray(req.body.items)) {
      const sortedItems = [...req.body.items].sort((a, b) => a.order - b.order);
      orderedIds = sortedItems.map((i: any) => i.id || i._id);
    }

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'orderedIds array or items array is required',
      });
      return;
    }

    const bulkOps = orderedIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { sortOrder: index } },
      },
    }));

    await Category.bulkWrite(bulkOps);

    const categories = await Category.find().sort({ sortOrder: 1 });
    const mappedCats = categories.map((c) => {
      const obj = c.toObject();
      return { ...obj, order: obj.sortOrder, isActive: obj.isActive !== false };
    });

    res.json({
      success: true,
      data: { categories: mappedCats },
      message: 'Categories reordered successfully',
    });
  } catch (error: any) {
    console.error('ReorderCategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
