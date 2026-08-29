import { Response } from 'express';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import { AuthRequest } from '../middleware/auth.js';
import {
  formatAsRestaurant,
  getOrCreateRestaurant,
  findRestaurantBySlug,
} from '../utils/restaurant.js';

export const seedDemoMenu = async (restaurantId: unknown) => {
  try {
    const wantedCats = [
      { name: 'Coffee', sortOrder: 0 },
      { name: 'Snacks', sortOrder: 1 },
      { name: 'Burgers', sortOrder: 2 },
      { name: 'Smoothies', sortOrder: 3 },
      { name: 'Desserts', sortOrder: 4 },
    ];

    const catMap: Record<string, unknown> = {};

    for (const wc of wantedCats) {
      let cat = await Category.findOne({ restaurantId, name: wc.name });
      if (!cat) {
        cat = new Category({
          restaurantId,
          name: wc.name,
          sortOrder: wc.sortOrder,
          isActive: true,
        });
        await cat.save();
      }
      catMap[wc.name] = cat._id;
    }

    const images = {
      cappuccino: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=500&fit=crop',
      espresso: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=500&fit=crop',
      latte: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&h=500&fit=crop',
      coldCoffee: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=500&fit=crop',
      samosa: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=500&fit=crop',
      springRoll: 'https://images.unsplash.com/photo-1548507200-47fdd5e1b5e4?w=400&h=500&fit=crop',
      paneerTikka: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=500&fit=crop',
      vegBurger: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=500&fit=crop',
      chickenBurger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=500&fit=crop',
      mangoSmoothie: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=500&fit=crop',
      berrySmoothie: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=500&fit=crop',
      brownie: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=500&fit=crop',
      gulabJamun: 'https://images.unsplash.com/photo-1666190020635-4dc2e74e924f?w=400&h=500&fit=crop',
      cheesecake: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=500&fit=crop',
    };

    const demoItems = [
      { catName: 'Coffee', name: 'Cappuccino', description: 'Rich espresso with steamed milk foam', price: 180, vegType: 'veg', image: images.cappuccino, order: 0 },
      { catName: 'Coffee', name: 'Espresso', description: 'Strong and bold single shot', price: 150, vegType: 'veg', image: images.espresso, order: 1 },
      { catName: 'Coffee', name: 'Café Latte', description: 'Smooth espresso with creamy milk', price: 200, vegType: 'veg', image: images.latte, order: 2 },
      { catName: 'Coffee', name: 'Cold Coffee', description: 'Chilled coffee with ice cream', price: 220, vegType: 'veg', image: images.coldCoffee, order: 3 },
      { catName: 'Snacks', name: 'Samosa', description: 'Crispy pastry filled with spiced potatoes', price: 40, vegType: 'veg', image: images.samosa, order: 0 },
      { catName: 'Snacks', name: 'Spring Roll', description: 'Crispy rolls with mixed vegetables', price: 80, vegType: 'veg', image: images.springRoll, order: 1 },
      { catName: 'Snacks', name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 180, vegType: 'veg', image: images.paneerTikka, order: 2 },
      { catName: 'Burgers', name: 'Classic Veg Burger', description: 'Crispy veg patty with fresh lettuce', price: 150, vegType: 'veg', image: images.vegBurger, order: 0 },
      { catName: 'Burgers', name: 'Chicken Burger', description: 'Juicy grilled chicken with mayo', price: 220, vegType: 'nonveg', image: images.chickenBurger, order: 1 },
      { catName: 'Smoothies', name: 'Mango Smoothie', description: 'Fresh mango blended with yogurt', price: 180, vegType: 'veg', image: images.mangoSmoothie, order: 0 },
      { catName: 'Smoothies', name: 'Berry Blast', description: 'Mixed berries with honey', price: 200, vegType: 'veg', image: images.berrySmoothie, order: 1 },
      { catName: 'Desserts', name: 'Chocolate Brownie', description: 'Warm fudgy brownie with ice cream', price: 180, vegType: 'veg', image: images.brownie, order: 0 },
      { catName: 'Desserts', name: 'Gulab Jamun', description: 'Soft milk dumplings in sugar syrup', price: 100, vegType: 'veg', image: images.gulabJamun, order: 1 },
      { catName: 'Desserts', name: 'Cheesecake', description: 'New York style baked cheesecake', price: 250, vegType: 'veg', image: images.cheesecake, order: 2 },
    ];

    for (const item of demoItems) {
      const existing = await MenuItem.findOne({ restaurantId, name: item.name });
      if (!existing) {
        await MenuItem.create({
          restaurantId,
          categoryId: catMap[item.catName],
          name: item.name,
          description: item.description,
          price: item.price,
          vegType: item.vegType as 'veg' | 'nonveg',
          image: item.image,
          featured: false,
          available: true,
          order: item.order,
        });
      }
    }
  } catch (err) {
    console.error('Failed to seed demo menu:', err);
  }
};

export const getRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurant = await getOrCreateRestaurant();
    const itemCount = await MenuItem.countDocuments({ restaurantId: restaurant._id });
    if (itemCount === 0) {
      await seedDemoMenu(restaurant._id);
    }
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
    const { name, description, logo, coverImage, slug, googleReviewUrl, googleRating } = req.body;
    const restaurant = await getOrCreateRestaurant();

    if (name !== undefined) restaurant.name = name;
    if (description !== undefined) restaurant.description = description;
    if (logo !== undefined) restaurant.logo = logo;
    if (coverImage !== undefined) restaurant.coverImage = coverImage;
    if (slug !== undefined) restaurant.slug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    if (googleReviewUrl !== undefined) restaurant.googleReviewUrl = googleReviewUrl;
    if (googleRating !== undefined) restaurant.googleRating = Number(googleRating);

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

    let categories = await Category.find({ restaurantId, isActive: { $ne: false } }).sort({
      sortOrder: 1,
    });
    let menuItems = await MenuItem.find({ restaurantId, available: true }).sort({ order: 1 });

    if (categories.length === 0 || menuItems.length === 0) {
      await seedDemoMenu(restaurantId);
      categories = await Category.find({ restaurantId, isActive: { $ne: false } }).sort({
        sortOrder: 1,
      });
      menuItems = await MenuItem.find({ restaurantId, available: true }).sort({ order: 1 });
    }

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
