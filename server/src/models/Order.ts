import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  menuItemId?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  vegType?: 'veg' | 'nonveg';
  notes?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';

export interface IOrder extends Document {
  restaurantId: mongoose.Types.ObjectId;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  items: IOrderItem[];
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  specialInstructions?: string;
  round: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    vegType: { type: String, enum: ['veg', 'nonveg'], default: 'veg' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    tableNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v: IOrderItem[]) => Array.isArray(v) && v.length > 0, 'Order must contain at least one item'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'served', 'completed', 'cancelled'],
      default: 'preparing',
      index: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    round: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, tableNumber: 1, status: 1 });
orderSchema.index({ restaurantId: 1, createdAt: -1, status: 1 });

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
