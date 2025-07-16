import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for Balance document
export interface IBalance extends Document {
  uuid: string;
  amount: number;
  date: Date;
  description: string;
  account: {
    uuid: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema for Balance
const BalanceSchema: Schema = new Schema({
  uuid: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  account: {
    uuid: { type: String, required: true },
    name: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create and export the model
export default mongoose.model<IBalance>('Balance', BalanceSchema);