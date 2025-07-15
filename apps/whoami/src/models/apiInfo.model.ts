import mongoose, { Document, Schema } from 'mongoose';

// Interface representing the ApiInfo document
export interface IApiInfo extends Document {
  _id: string;
  apiId: string;
  createdAt: Date;
}

// Schema definition for the ApiInfo model
const ApiInfoSchema: Schema = new Schema({
  _id: { type: String, required: true },
  apiId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create and export the model
export const ApiInfoModel = mongoose.model<IApiInfo>('ApiInfo', ApiInfoSchema, 'api_info');