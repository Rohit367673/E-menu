import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  sortOrder: number;
  isActive: boolean;
  printSketch?: string;
}

const categorySchema = new Schema<ICategory>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    printSketch: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ restaurantId: 1, sortOrder: 1 });

const Category: Model<ICategory> = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
