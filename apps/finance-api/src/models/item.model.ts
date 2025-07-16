import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for Item document
export interface IItem extends Document {
  uuid: string;
  description: string;
  group: string;
  units: number;
  unitPrice: number;
  area: number;
  areaPrice: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema for Item
const ItemSchema: Schema = new Schema({
  uuid: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  group: { type: String, required: true },
  units: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  area: { type: Number, required: true },
  areaPrice: { type: Number, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create and export the model
export default mongoose.model<IItem>('Item', ItemSchema);