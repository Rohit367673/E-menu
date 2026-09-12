/* Authentic Sukoon Cafe & Bar Menu Seed Script
   Transcribed directly from the 20-page official restaurant menu.
   Imports standardized catalog from ./src/data/sukoonMenu.js.
*/
import mongoose from 'mongoose';
import { categoriesData, menuItemsData } from './src/data/sukoonMenu.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emenu';

async function seed() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;

  // 1. Get or create restaurant
  let restaurant = await db.collection('restaurants').findOne({});
  if (!restaurant) {
    const result = await db.collection('restaurants').insertOne({
      name: 'Sukoon Cafe & Bar',
      slug: 'sukoon',
      description: 'Discover the ultimate spot for delicious meals, relaxing moments, and spectacular moon rise views in Dharamkot’s magical setting!',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    restaurant = { _id: result.insertedId, name: 'Sukoon Cafe & Bar' };
  } else {
    await db.collection('restaurants').updateOne(
      { _id: restaurant._id },
      {
        $set: {
          name: 'Sukoon Cafe & Bar',
          slug: 'sukoon',
          description: 'Discover the ultimate spot for delicious meals, relaxing moments, and spectacular moon rise views in Dharamkot’s magical setting!',
        },
      }
    );
  }

  const restId = restaurant._id;
  console.log(`Using Restaurant: ${restaurant.name} (${restId})`);

  // 2. Clear old categories and old menu items for this restaurant
  await db.collection('menuitems').deleteMany({ restaurantId: restId });
  console.log('Cleared existing menu items.');
  await db.collection('categories').deleteMany({ restaurantId: restId });
  console.log('Cleared existing categories.');

  // 3. Insert new categories
  const catMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of categoriesData) {
    const result = await db.collection('categories').insertOne({
      restaurantId: restId,
      name: cat.name,
      sortOrder: cat.sortOrder,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    catMap[cat.name] = result.insertedId as unknown as mongoose.Types.ObjectId;
    console.log(`Created category [${cat.sortOrder}]: ${cat.name}`);
  }

  // 4. Insert new menu items
  const itemDocs = menuItemsData.map((item, index) => {
    const categoryId = catMap[item.catName];
    if (!categoryId) {
      throw new Error(`Category not found for item: ${item.name} (${item.catName})`);
    }

    return {
      restaurantId: restId,
      categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      vegType: item.vegType,
      image: item.image,
      featured: item.featured ?? false,
      available: true,
      order: index,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  await db.collection('menuitems').insertMany(itemDocs);
  console.log(`Successfully inserted ${itemDocs.length} authentic Sukoon Cafe & Bar menu items!`);

  await mongoose.disconnect();
  console.log('MongoDB disconnected. Seeding completed successfully!');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
