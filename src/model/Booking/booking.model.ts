import mongoose, { Schema, Document } from "mongoose";

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  salonId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  bookingDate: Date;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  status: BookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    salonId: {
      type: Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // Format: "HH:MM"
      required: true,
    },
    endTime: {
      type: String, // Format: "HH:MM"
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
