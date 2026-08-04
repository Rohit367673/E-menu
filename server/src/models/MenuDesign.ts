import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMenuDesign extends Document {
  name: string;
  description: string;
  logo?: string;
  coverImage?: string;
  canvasData?: string;
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

const menuDesignSchema = new Schema<IMenuDesign>(
  {
    name: {
      type: String,
      default: "Client's Restaurant",
    },
    description: {
      type: String,
      default: 'Premium tableside digital menu experience.',
    },
    logo: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    canvasData: {
      type: String,
      default: '',
    },
    theme: {
      type: String,
      default: 'custom-canvas',
    },
    colors: {
      primary: { type: String, default: '#E65100' },
      secondary: { type: String, default: '#FF8A65' },
      background: { type: String, default: '#FFF8F0' },
      surface: { type: String, default: '#FFFFFF' },
      text: { type: String, default: '#1A1A1A' },
      textSecondary: { type: String, default: '#666666' },
      accent: { type: String, default: '#FF5722' },
    },
    fonts: {
      heading: { type: String, default: 'Outfit' },
      body: { type: String, default: 'Inter' },
    },
  },
  {
    timestamps: true,
  }
);

const MenuDesign: Model<IMenuDesign> = mongoose.model<IMenuDesign>('MenuDesign', menuDesignSchema);

export default MenuDesign;
