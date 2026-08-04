/* Seed script — adds dummy menu items with food images to existing categories */
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/emenu';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;

  // Get restaurant
  const restaurant = await db.collection('restaurants').findOne({});
  if (!restaurant) { console.log('No restaurant found'); process.exit(1); }
  const restId = restaurant._id;
  console.log(`Restaurant: ${restaurant.name} (${restId})`);

  // Get existing categories
  const existingCats = await db.collection('categories').find({ restaurantId: restId }).toArray();
  console.log(`Existing categories: ${existingCats.map(c => c.name).join(', ')}`);

  // Ensure we have the right categories — add if missing
  const wantedCats = [
    { name: 'Coffee', sortOrder: 0 },
    { name: 'Snacks', sortOrder: 1 },
    { name: 'Burgers', sortOrder: 2 },
    { name: 'Smoothies', sortOrder: 3 },
    { name: 'Desserts', sortOrder: 4 },
  ];

  const catMap: Record<string, mongoose.Types.ObjectId> = {};

  for (const wc of wantedCats) {
    const existing = existingCats.find(c => c.name.toLowerCase() === wc.name.toLowerCase());
    if (existing) {
      catMap[wc.name] = existing._id;
      // Update sort order
      await db.collection('categories').updateOne({ _id: existing._id }, { $set: { sortOrder: wc.sortOrder } });
    } else {
      const result = await db.collection('categories').insertOne({
        restaurantId: restId,
        name: wc.name,
        sortOrder: wc.sortOrder,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      catMap[wc.name] = result.insertedId as unknown as mongoose.Types.ObjectId;
      console.log(`Created category: ${wc.name}`);
    }
  }

  // Food image URLs (free, reliable placeholder images)
  const images = {
    cappuccino: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=500&fit=crop',
    espresso: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=500&fit=crop',
    latte: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&h=500&fit=crop',
    coldCoffee: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=500&fit=crop',
    hotChocolate: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=500&fit=crop',

    samosa: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=500&fit=crop',
    springRoll: 'https://images.unsplash.com/photo-1548507200-47fdd5e1b5e4?w=400&h=500&fit=crop',
    paneerTikka: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=500&fit=crop',
    frenchFries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=500&fit=crop',

    vegBurger: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=500&fit=crop',
    chickenBurger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=500&fit=crop',
    cheeseBurger: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=500&fit=crop',
    classicBurger: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=500&fit=crop',

    mangoSmoothie: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=500&fit=crop',
    berrySmoothie: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=500&fit=crop',
    bananaSmoothie: 'https://images.unsplash.com/photo-1638176066666-c2af8b002840?w=400&h=500&fit=crop',
    greenSmoothie: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=500&fit=crop',

    brownie: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=500&fit=crop',
    gulabJamun: 'https://images.unsplash.com/photo-1666190020635-4dc2e74e924f?w=400&h=500&fit=crop',
    iceCream: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=500&fit=crop',
    cheesecake: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=500&fit=crop',
  };

  // Items to seed
  const items = [
    // Coffee
    { catName: 'Coffee', name: 'Cappuccino', description: 'Rich espresso with steamed milk foam', price: 180, vegType: 'veg', image: images.cappuccino, order: 0 },
    { catName: 'Coffee', name: 'Espresso', description: 'Strong and bold single shot', price: 150, vegType: 'veg', image: images.espresso, order: 1 },
    { catName: 'Coffee', name: 'Café Latte', description: 'Smooth espresso with creamy milk', price: 200, vegType: 'veg', image: images.latte, order: 2 },
    { catName: 'Coffee', name: 'Cold Coffee', description: 'Chilled coffee with ice cream', price: 220, vegType: 'veg', image: images.coldCoffee, order: 3 },
    { catName: 'Coffee', name: 'Hot Chocolate', description: 'Warm Belgian chocolate with whipped cream', price: 190, vegType: 'veg', image: images.hotChocolate, order: 4 },

    // Snacks
    { catName: 'Snacks', name: 'Samosa', description: 'Crispy pastry filled with spiced potatoes', price: 40, vegType: 'veg', image: images.samosa, order: 0 },
    { catName: 'Snacks', name: 'Spring Roll', description: 'Crispy rolls with mixed vegetables', price: 80, vegType: 'veg', image: images.springRoll, order: 1 },
    { catName: 'Snacks', name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 180, vegType: 'veg', image: images.paneerTikka, order: 2 },
    { catName: 'Snacks', name: 'French Fries', description: 'Crispy golden fries with dip', price: 120, vegType: 'veg', image: images.frenchFries, order: 3 },

    // Burgers
    { catName: 'Burgers', name: 'Classic Veg Burger', description: 'Crispy veg patty with fresh lettuce', price: 150, vegType: 'veg', image: images.vegBurger, order: 0 },
    { catName: 'Burgers', name: 'Chicken Burger', description: 'Juicy grilled chicken with mayo', price: 220, vegType: 'nonveg', image: images.chickenBurger, order: 1 },
    { catName: 'Burgers', name: 'Cheese Burst Burger', description: 'Double cheese with jalapenos', price: 250, vegType: 'veg', image: images.cheeseBurger, order: 2 },
    { catName: 'Burgers', name: 'BBQ Burger', description: 'Smoky BBQ sauce with caramelized onions', price: 280, vegType: 'nonveg', image: images.classicBurger, order: 3 },

    // Smoothies
    { catName: 'Smoothies', name: 'Mango Smoothie', description: 'Fresh mango blended with yogurt', price: 180, vegType: 'veg', image: images.mangoSmoothie, order: 0 },
    { catName: 'Smoothies', name: 'Berry Blast', description: 'Mixed berries with honey', price: 200, vegType: 'veg', image: images.berrySmoothie, order: 1 },
    { catName: 'Smoothies', name: 'Banana Shake', description: 'Banana with vanilla ice cream', price: 160, vegType: 'veg', image: images.bananaSmoothie, order: 2 },
    { catName: 'Smoothies', name: 'Green Detox', description: 'Spinach, apple, and ginger blend', price: 220, vegType: 'veg', image: images.greenSmoothie, order: 3 },

    // Desserts
    { catName: 'Desserts', name: 'Chocolate Brownie', description: 'Warm fudgy brownie with ice cream', price: 180, vegType: 'veg', image: images.brownie, order: 0 },
    { catName: 'Desserts', name: 'Gulab Jamun', description: 'Soft milk dumplings in sugar syrup', price: 100, vegType: 'veg', image: images.gulabJamun, order: 1 },
    { catName: 'Desserts', name: 'Ice Cream Sundae', description: 'Vanilla with chocolate sauce and nuts', price: 150, vegType: 'veg', image: images.iceCream, order: 2 },
    { catName: 'Desserts', name: 'Cheesecake', description: 'New York style baked cheesecake', price: 250, vegType: 'veg', image: images.cheesecake, order: 3 },
  ];

  // Clear existing menu items (except keep any with custom data)
  await db.collection('menuitems').deleteMany({ restaurantId: restId });
  console.log('Cleared existing menu items');

  // Insert new items
  const docs = items.map(item => ({
    restaurantId: restId,
    categoryId: catMap[item.catName],
    name: item.name,
    description: item.description,
    price: item.price,
    vegType: item.vegType,
    image: item.image,
    featured: false,
    available: true,
    order: item.order,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.collection('menuitems').insertMany(docs);
  console.log(`Inserted ${docs.length} menu items`);

  // Update restaurant name if it's still default
  await db.collection('restaurants').updateOne(
    { _id: restId },
    { $set: { name: 'ChillCups Café', description: 'Welcome to our menu — freshly brewed, freshly served.', slug: 'chillcups' } }
  );
  console.log('Updated restaurant name to ChillCups Café');

  await mongoose.disconnect();
  console.log('Done! Seeded successfully.');
}

seed().catch(err => { console.error(err); process.exit(1); });
