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
