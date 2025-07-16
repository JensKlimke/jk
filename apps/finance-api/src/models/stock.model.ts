import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for Stock document
export interface IStock extends Document {
  uuid: string;
  symbol: string;
  name: string;
  purchase: number;
  quantity: number;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema for Stock
const StockSchema: Schema = new Schema({
  uuid: { type: String, required: true, unique: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  purchase: { type: Number, required: true },
  quantity: { type: Number, required: true },
  value: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create and export the model
export default mongoose.model<IStock>('Stock', StockSchema);