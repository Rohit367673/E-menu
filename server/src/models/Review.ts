import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: 'Happy Customer',
      maxlength: 60,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    tags: {
      type: [String],
      default: [],
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Review: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
