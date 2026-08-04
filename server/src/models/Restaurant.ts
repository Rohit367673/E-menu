import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  coverImage?: string;
  theme: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      default: "Client's Restaurant",
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      default: 'menu',
    },
    logo: { type: String, default: '' },
    description: {
      type: String,
      default: 'Premium tableside digital menu experience.',
    },
    coverImage: { type: String, default: '' },
    theme: {
      type: String,
      default: 'modern-cafe',
    },
    colors: {
      primary: { type: String, default: '#8B5E3C' },
      secondary: { type: String, default: '#D4A574' },
      background: { type: String, default: '#FAF7F2' },
      surface: { type: String, default: '#FFFFFF' },
      text: { type: String, default: '#2C1810' },
      textSecondary: { type: String, default: '#6B5B4F' },
      accent: { type: String, default: '#C8956C' },
    },
    fonts: {
      heading: { type: String, default: 'Playfair Display' },
      body: { type: String, default: 'Inter' },
    },
  },
  { timestamps: true }
);

const Restaurant: Model<IRestaurant> = mongoose.model<IRestaurant>('Restaurant', restaurantSchema);

export default Restaurant;
