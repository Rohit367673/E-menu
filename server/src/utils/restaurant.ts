import Restaurant from '../models/Restaurant.js';
import MenuDesign from '../models/MenuDesign.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

export const formatAsRestaurant = (restaurant: {
  _id: unknown;
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  theme?: string;
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  googleReviewUrl?: string;
  googleRating?: number;
  createdAt?: Date;
  updatedAt?: Date;
}) => ({
  _id: restaurant._id,
  name: restaurant.name || "Sukoon Cafe & Bar",
  slug: restaurant.slug || 'menu',
  description: restaurant.description || 'Welcome to our menu!',
  logo: restaurant.logo || '',
  coverImage: restaurant.coverImage || '',
  googleReviewUrl: restaurant.googleReviewUrl || '',
  googleRating: restaurant.googleRating || 4.9,
  owner: 'admin',
  templateConfig: {
    templateId: restaurant.theme || 'modern-cafe',
    colors: restaurant.colors,
    fonts: restaurant.fonts,
    borderRadius: '12px',
    cardStyle: 'elevated',
    categoryStyle: 'pills',
    shadows: true,
  },
  createdAt: restaurant.createdAt,
  updatedAt: restaurant.updatedAt,
});

export const getOrCreateRestaurant = async () => {
  let restaurant = await Restaurant.findOne();
  if (restaurant) return restaurant;

  const legacyDesign = await MenuDesign.findOne();
  if (legacyDesign) {
    restaurant = new Restaurant({
      name: legacyDesign.name,
      slug: 'menu',
      logo: legacyDesign.logo,
      description: legacyDesign.description,
      coverImage: legacyDesign.coverImage,
      theme: legacyDesign.theme === 'custom-canvas' ? 'modern-cafe' : legacyDesign.theme,
      colors: legacyDesign.colors,
      fonts: legacyDesign.fonts,
    });
    await restaurant.save();

    await Category.updateMany({ restaurantId: { $exists: false } }, { restaurantId: restaurant._id });
    await MenuItem.updateMany({ restaurantId: { $exists: false } }, { restaurantId: restaurant._id });
    return restaurant;
  }

  restaurant = new Restaurant({
    name: "Sukoon Cafe & Bar",
    slug: 'menu',
    theme: 'modern-cafe',
  });
  await restaurant.save();
  return restaurant;
};

export const findRestaurantBySlug = async (slug?: string) => {
  if (!slug || slug === 'public' || slug === 'me') {
    return getOrCreateRestaurant();
  }
  const restaurant = await Restaurant.findOne({ slug: slug.toLowerCase() });
  return restaurant || getOrCreateRestaurant();
};
