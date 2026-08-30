import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.js';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import categoryRoutes from './routes/categories.js';
import menuRoutes from './routes/menu.js';
import uploadRoutes from './routes/upload.js';
import exportRoutes from './routes/export.js';
import qrRoutes from './routes/qr.js';
import reviewRoutes from './routes/reviews.js';
import Admin from './models/Admin.js';
import Restaurant from './models/Restaurant.js';
import Category from './models/Category.js';
import MenuItem from './models/MenuItem.js';
import MenuDesign from './models/MenuDesign.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'E-Menu API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu-items', menuRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

// Database Seeding Logic for Single Restaurant Setup
const seedDatabase = async () => {
  try {
    // 1. Seed Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@example.com';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const admin = new Admin({
        email: email.toLowerCase(),
        password,
      });
      await admin.save();
      console.log(`Seeded default admin account: ${email}`);
    }

    // 2. Seed default Restaurant (migrate from legacy MenuDesign if present)
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      const legacyDesign = await MenuDesign.findOne();
      restaurant = new Restaurant({
        name: legacyDesign?.name || "Client's Restaurant",
        slug: 'menu',
        description: legacyDesign?.description || 'Premium tableside digital menu experience.',
        logo: legacyDesign?.logo || '',
        coverImage: legacyDesign?.coverImage || '',
        theme: legacyDesign?.theme === 'custom-canvas' ? 'modern-cafe' : legacyDesign?.theme || 'modern-cafe',
        colors: legacyDesign?.colors || {
          primary: '#8B5E3C',
          secondary: '#D4A574',
          background: '#FAF7F2',
          surface: '#FFFFFF',
          text: '#2C1810',
          textSecondary: '#6B5B4F',
          accent: '#C8956C',
        },
        fonts: legacyDesign?.fonts || { heading: 'Playfair Display', body: 'Inter' },
      });
      await restaurant.save();
      console.log('Seeded default restaurant.');
    }

    // 3. Backfill restaurantId on existing categories and menu items
    await Category.updateMany(
      { restaurantId: { $exists: false } },
      { $set: { restaurantId: restaurant!._id, isActive: true } }
    );
    await MenuItem.updateMany(
      { restaurantId: { $exists: false } },
      { $set: { restaurantId: restaurant!._id } }
    );

    // 4. Seed demo menu items & categories if menu is empty
    const itemCount = await MenuItem.countDocuments();
    if (itemCount === 0) {
      console.log('No menu items found. Seeding demo menu data...');
      
      const wantedCats = [
        { name: 'Coffee', sortOrder: 0 },
        { name: 'Snacks', sortOrder: 1 },
        { name: 'Burgers', sortOrder: 2 },
        { name: 'Smoothies', sortOrder: 3 },
        { name: 'Desserts', sortOrder: 4 },
      ];

      const catMap: Record<string, unknown> = {};

      for (const wc of wantedCats) {
        let cat = await Category.findOne({ restaurantId: restaurant!._id, name: wc.name });
        if (!cat) {
          cat = new Category({
            restaurantId: restaurant!._id,
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
        await MenuItem.create({
          restaurantId: restaurant!._id,
          categoryId: catMap[item.catName],
          name: item.name,
          description: item.description,
          price: item.price,
          vegType: item.vegType,
          image: item.image,
          featured: false,
          available: true,
          order: item.order,
        });
      }

      if (restaurant!.name === "Client's Restaurant") {
        restaurant!.name = 'ChillCups Café';
        restaurant!.description = 'Welcome to our menu — freshly brewed, freshly served.';
        await restaurant!.save();
      }

      console.log('Demo menu items seeded successfully!');
    }
  } catch (error) {
    console.error('Database seeding failed:', error);
  }
};

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`Health check: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
