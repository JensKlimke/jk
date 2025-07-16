import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for Account document
export interface IAccount extends Document {
  uuid: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema for Account
const AccountSchema: Schema = new Schema({
  uuid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create and export the model
export default mongoose.model<IAccount>('Account', AccountSchema);