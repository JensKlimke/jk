import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for Contract document
export interface IContract extends Document {
  uuid: string;
  name: string;
  creditor: string;
  amount: number;
  shared: boolean;
  months: boolean[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema for Contract
const ContractSchema: Schema = new Schema({
  uuid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  creditor: { type: String, required: true },
  amount: { type: Number, required: true },
  shared: { type: Boolean, required: true },
  months: { type: [Boolean], required: true, validate: [arrayLimit, '{PATH} must have exactly 12 elements'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Validator function to ensure months array has exactly 12 elements
function arrayLimit(val: boolean[]) {
  return val.length === 12;
}

// Create and export the model
export default mongoose.model<IContract>('Contract', ContractSchema);