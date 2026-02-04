import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  salonId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    salonId: {
      type: Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 1, // at least 1 minute
    },
    isDeleted: {
      type: Boolean,
      default: false, // soft delete flag
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IService>("Service", ServiceSchema);
