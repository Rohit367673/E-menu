import mongoose, { Schema, Document, Model } from 'mongoose';

export type SessionStatus = 'active' | 'settled' | 'cleared';

export interface ITableSession extends Document {
  restaurantId: mongoose.Types.ObjectId;
  sessionNumber: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  status: SessionStatus;
  billRequested: boolean;
  billRequestedAt?: Date;
  startedAt: Date;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tableSessionSchema = new Schema<ITableSession>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    sessionNumber: {
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
    status: {
      type: String,
      enum: ['active', 'settled', 'cleared'],
      default: 'active',
      index: true,
    },
    billRequested: {
      type: Boolean,
      default: false,
      index: true,
    },
    billRequestedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    settledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

tableSessionSchema.index({ restaurantId: 1, tableNumber: 1, status: 1 });
tableSessionSchema.index({ restaurantId: 1, status: 1 });

const TableSession: Model<ITableSession> = mongoose.model<ITableSession>('TableSession', tableSessionSchema);

export default TableSession;
