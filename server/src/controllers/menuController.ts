import { Response } from 'express';
import MenuItem from '../models/MenuItem.js';
import { AuthRequest } from '../middleware/auth.js';
import { getOrCreateRestaurant } from '../utils/restaurant.js';

export const getMenuItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurant = await getOrCreateRestaurant();
    const filter: Record<string, unknown> = { restaurantId: restaurant._id };

    if (req.query.category) {
      filter.categoryId = req.query.category;
    }

    const menuItems = await MenuItem.find(filter)
      .populate('categoryId', 'name')
      .sort({ categoryId: 1, order: 1 });

    // Map response to match the client's expected types (category as string ID)
    const mappedMenuItems = menuItems.map((item) => {
      const itemObj = item.toObject();
      return {
        ...itemObj,
        category: itemObj.categoryId ? String((itemObj.categoryId as { _id?: unknown })._id ?? itemObj.categoryId) : '',
        isAvailable: itemObj.available,
      };
    });

    res.json({
      success: true,
      data: { menuItems: mappedMenuItems },
    });
  } catch (error: any) {
    console.error('GetMenuItems error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const createMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      category, // comes from client as category ID
      name,
      description,
      price,
      discountPrice,
      image,
      vegType,
      featured,
      available,
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Item name is required',
      });
      return;
    }

    if (!category) {
      res.status(400).json({
        success: false,
        message: 'Category is required',
      });
      return;
    }

    if (price === undefined || price === null || price < 0) {
      res.status(400).json({
        success: false,
        message: 'Valid price is required',
      });
      return;
    }

    const restaurant = await getOrCreateRestaurant();

    const maxOrderItem = await MenuItem.findOne({
      restaurantId: restaurant._id,
      categoryId: category,
    })
      .sort({ order: -1 })
      .select('order');

    const order = maxOrderItem ? maxOrderItem.order + 1 : 0;

    const menuItem = new MenuItem({
      restaurantId: restaurant._id,
      categoryId: category,
      name: name.trim(),
      description: description || '',
      price,
      discountPrice: discountPrice || undefined,
      image: image || undefined,
      vegType: vegType || 'veg',
      featured: featured || false,
      available: available !== undefined ? available : true,
      order,
    });

    await menuItem.save();

    const resultObj = menuItem.toObject();
    const mappedItem = {
      ...resultObj,
      category: resultObj.categoryId ? resultObj.categoryId.toString() : '',
      isAvailable: resultObj.available,
    };

    res.status(201).json({
      success: true,
      data: { menuItem: mappedItem },
      message: 'Menu item created successfully',
    });
  } catch (error: any) {
    console.error('CreateMenuItem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      category,
      name,
      description,
      price,
      discountPrice,
      image,
      vegType,
      featured,
      available,
    } = req.body;

    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
      return;
    }

    if (category !== undefined) menuItem.categoryId = category;
    if (name !== undefined) menuItem.name = name.trim();
    if (description !== undefined) menuItem.description = description;
    if (price !== undefined) menuItem.price = price;
    if (discountPrice !== undefined) menuItem.discountPrice = discountPrice;
    if (image !== undefined) menuItem.image = image;
    if (vegType !== undefined) menuItem.vegType = vegType;
    if (featured !== undefined) menuItem.featured = featured;
    if (available !== undefined) menuItem.available = available;

    await menuItem.save();

    const resultObj = menuItem.toObject();
    const mappedItem = {
      ...resultObj,
      category: resultObj.categoryId ? resultObj.categoryId.toString() : '',
      isAvailable: resultObj.available,
    };

    res.json({
      success: true,
      data: { menuItem: mappedItem },
      message: 'Menu item updated successfully',
    });
  } catch (error: any) {
    console.error('UpdateMenuItem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const deleteMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
      return;
    }

    await MenuItem.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error: any) {
    console.error('DeleteMenuItem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const reorderMenuItems = async (req: AuthRequest, res: Response): Promise<void> => {
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
        update: { $set: { order: index } },
      },
    }));

    await MenuItem.bulkWrite(bulkOps);

    const restaurant = await getOrCreateRestaurant();
    const menuItems = await MenuItem.find({ restaurantId: restaurant._id })
      .populate('categoryId', 'name')
      .sort({ categoryId: 1, order: 1 });

    const mappedMenuItems = menuItems.map((item) => {
      const itemObj = item.toObject();
      return {
        ...itemObj,
        category: itemObj.categoryId ? String((itemObj.categoryId as { _id?: unknown })._id ?? itemObj.categoryId) : '',
        isAvailable: itemObj.available,
      };
    });

    res.json({
      success: true,
      data: { menuItems: mappedMenuItems },
      message: 'Menu items reordered successfully',
    });
  } catch (error: any) {
    console.error('ReorderMenuItems error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const toggleAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
      return;
    }

    menuItem.available = !menuItem.available;
    await menuItem.save();

    const resultObj = menuItem.toObject();
    const mappedItem = {
      ...resultObj,
      category: resultObj.categoryId ? resultObj.categoryId.toString() : '',
      isAvailable: resultObj.available,
    };

    res.json({
      success: true,
      data: { menuItem: mappedItem },
      message: `Menu item ${menuItem.available ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error: any) {
    console.error('ToggleAvailability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
