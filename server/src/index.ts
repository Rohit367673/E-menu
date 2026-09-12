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
import orderRoutes from './routes/orders.js';
import Admin from './models/Admin.js';
import Restaurant from './models/Restaurant.js';
import Category from './models/Category.js';
import MenuItem from './models/MenuItem.js';
import MenuDesign from './models/MenuDesign.js';
import { categoriesData, menuItemsData } from './data/sukoonMenu.js';
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

// CORS configuration — supports localhost, mobile LAN devices (192.168.x.x), and cloud tunnels
const allowedOrigins = [
  env.CLIENT_URL,
  env.APP_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow local network IP addresses (192.168.x.x, 10.x.x.x, 172.x.x.x, localhost)
      if (
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          origin
        )
      ) {
        return callback(null, true);
      }
      // Allow cloud tunnel/deployment domains (ngrok, localtunnel, vercel, render)
      if (
        origin.endsWith('.ngrok-free.app') ||
        origin.endsWith('.loca.lt') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      // In development or demo mode, permit origin
      if (env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(null, true);
    },
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
app.use('/api/orders', orderRoutes);

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
    // 1. Seed or Update Admin (Owner) Accounts
    const ownerAccounts = [
      { email: 'owner@sukoon.com', password: 'owner123', name: 'Sukoon Owner', role: 'admin' },
      { email: (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase(), password: process.env.ADMIN_PASSWORD || 'admin123', name: 'Sukoon Owner', role: 'admin' },
    ];

    for (const acc of ownerAccounts) {
      let user = await Admin.findOne({ email: acc.email });
      if (!user) {
        user = new Admin({
          email: acc.email,
          password: acc.password,
          role: 'admin',
          name: acc.name,
        });
        await user.save();
        console.log(`Seeded owner account: ${acc.email}`);
      } else if (user.role !== 'admin') {
        user.role = 'admin';
        user.name = acc.name;
        await user.save();
      }
    }

    // 1b. Seed or Update Manager Accounts
    const managerAccounts = [
      { email: 'manager@sukoon.com', password: 'manager123', name: 'Store Manager', role: 'manager' },
      { email: (process.env.MANAGER_EMAIL || 'manager@example.com').toLowerCase(), password: process.env.MANAGER_PASSWORD || 'manager123', name: 'Store Manager', role: 'manager' },
    ];

    for (const acc of managerAccounts) {
      let user = await Admin.findOne({ email: acc.email });
      if (!user) {
        user = new Admin({
          email: acc.email,
          password: acc.password,
          role: 'manager',
          name: acc.name,
        });
        await user.save();
        console.log(`Seeded manager account: ${acc.email}`);
      } else if (user.role !== 'manager') {
        user.role = 'manager';
        user.name = acc.name;
        await user.save();
      }
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

    // 4. Seed authentic menu items & categories if menu is empty
    const itemCount = await MenuItem.countDocuments();
    if (itemCount === 0) {
      console.log('No menu items found. Seeding authentic Sukoon Cafe & Bar menu data...');
      
      const catMap: Record<string, any> = {};

      for (const wc of categoriesData) {
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

      for (let i = 0; i < menuItemsData.length; i++) {
        const item = menuItemsData[i];
        const categoryId = catMap[item.catName];
        if (categoryId) {
          await MenuItem.create({
            restaurantId: restaurant!._id,
            categoryId,
            name: item.name,
            description: item.description,
            price: item.price,
            vegType: item.vegType,
            image: item.image,
            featured: item.featured ?? false,
            available: true,
            order: i,
          });
        }
      }

      if (restaurant!.name === "Client's Restaurant" || restaurant!.name === 'ChillCups Café') {
        restaurant!.name = 'Sukoon Cafe & Bar';
        restaurant!.description = 'Discover the ultimate spot for delicious meals, relaxing moments, and spectacular moon rise views in Dharamkot’s magical setting!';
        await restaurant!.save();
      }

      console.log(`Authentic menu items seeded successfully (${menuItemsData.length} items)!`);
    }

    // Always ensure current restaurant name is updated to "Sukoon Cafe & Bar"
    const currentRest = await Restaurant.findOne();
    if (currentRest && (currentRest.name === "Client's Restaurant" || currentRest.name === 'ChillCups Café')) {
      currentRest.name = 'Sukoon Cafe & Bar';
      currentRest.description = 'Welcome to our menu — freshly brewed, crafted with serenity.';
      await currentRest.save();
      console.log('Updated restaurant brand to Sukoon Cafe & Bar in database');
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
