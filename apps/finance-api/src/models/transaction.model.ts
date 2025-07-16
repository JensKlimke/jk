import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for Transaction document
export interface ITransaction extends Document {
  uuid: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  account: {
    uuid: string;
    name: string;
  };
  payer?: string;
  creditor?: string;
  category?: string;
  invoice?: boolean;
  item?: string;
  orderType?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema for Transaction
const TransactionSchema: Schema = new Schema({
  uuid: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['deposit', 'expense', 'order', 'transfer'] },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  account: {
    uuid: { type: String, default: '' },
    name: { type: String, required: true }
  },
  payer: { type: String },
  creditor: { type: String },
  category: { type: String },
  invoice: { type: Boolean },
  item: { type: String },
  orderType: { type: String, enum: ['purchase', 'sale', 'dividend', 'savings_plan', 'other'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create and export the model
export default mongoose.model<ITransaction>('Transaction', TransactionSchema);