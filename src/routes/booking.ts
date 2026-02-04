import express from "express";
import {
  createBooking,
  getBookingHistory,
  cancelBooking,
  rescheduleBooking,
  getBookingsBySalon,
  approveBooking,
  rejectBooking,
  getBookingById,
} from "../controller/booking.controller";
import { authenticate } from "../middleware/auth.middleware";

const BookingRoute = express.Router();

// All booking routes require authentication
BookingRoute.use(authenticate);

// 4.3 Booking Creation - Customer creates booking
BookingRoute.post("/", createBooking);

// Get booking by ID (both customer and salon owner can access)
BookingRoute.get("/:bookingId", getBookingById);

// 4.4 Booking Management - Customer operations
BookingRoute.get("/customer/history", getBookingHistory); // Get booking history
BookingRoute.put("/:bookingId/cancel", cancelBooking); // Cancel booking
BookingRoute.put("/:bookingId/reschedule", rescheduleBooking); // Reschedule booking

// 4.5 Booking Approval - Salon owner operations
BookingRoute.get("/salon/:salonId/bookings", getBookingsBySalon); // Get all bookings for salon
BookingRoute.put("/:bookingId/approve", approveBooking); // Approve booking
BookingRoute.put("/:bookingId/reject", rejectBooking); // Reject booking

export default BookingRoute;
