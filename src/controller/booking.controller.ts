import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Booking, { BookingStatus, IBooking } from "../model/Booking/booking.model";
import Service from "../model/Service/service.model";
import Salon from "../model/Salon/salon.model";
import User from "../model/user.model";
import mongoose from "mongoose";
import { sendEmail } from "../utils/sendEmail";

// 4.3 Booking Creation - Customer creates booking
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { salonId, serviceId, bookingDate, startTime, notes } = req.body;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Validate input
    if (!salonId || !serviceId || !bookingDate || !startTime) {
      return res.status(400).json({
        error: "All fields are required (salonId, serviceId, bookingDate, startTime)",
      });
    }

    // Validate date is not in the past
    const bookingDateObj = new Date(bookingDate);
    if (bookingDateObj < new Date()) {
      return res.status(400).json({
        error: "Booking date must be in the future",
      });
    }

    // Check if salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        error: "Salon not found",
      });
    }

    // Check if service exists
    const service = await Service.findOne({
      _id: serviceId,
      salonId,
      isDeleted: false,
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    // Calculate end time based on service duration
    const [hours, minutes] = startTime.split(":").map(Number);
    const endTimeDate = new Date();
    endTimeDate.setHours(hours, minutes + service.duration);
    const endTime = `${String(endTimeDate.getHours()).padStart(2, "0")}:${String(
      endTimeDate.getMinutes()
    ).padStart(2, "0")}`;

    // Check for booking conflicts
    const existingBooking = await Booking.findOne({
      salonId: new mongoose.Types.ObjectId(salonId),
      bookingDate: {
        $gte: new Date(bookingDate + "T00:00:00"),
        $lte: new Date(bookingDate + "T23:59:59"),
      },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
      status: { $ne: BookingStatus.CANCELLED },
    });

    if (existingBooking) {
      return res.status(409).json({
        error: "Time slot is already booked",
      });
    }

    // Create booking
    const newBooking = await Booking.create({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      salonId: new mongoose.Types.ObjectId(salonId),
      serviceId: new mongoose.Types.ObjectId(serviceId),
      bookingDate: bookingDateObj,
      startTime,
      endTime,
      status: BookingStatus.PENDING,
      notes,
    });

    // Fetch user and salon owner details for email
    const user = await User.findById(req.user.userId);
    const salonOwner = await User.findById(salon.owner);

    // Send confirmation email to customer
    if (user) {
      const customerEmailHtml = `
        <h2>Booking Confirmation</h2>
        <p>Hi ${user.firstname},</p>
        <p>Your booking has been received and is awaiting approval.</p>
        <hr/>
        <h3>Booking Details:</h3>
        <p><strong>Salon:</strong> ${salon.salonName}</p>
        <p><strong>Service:</strong> ${service.name}</p>
        <p><strong>Date:</strong> ${bookingDate}</p>
        <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Duration:</strong> ${service.duration} minutes</p>
        <p><strong>Price:</strong> $${service.price}</p>
        <hr/>
        <p>The salon owner will review and confirm your booking shortly.</p>
        <p>You will receive another email once your booking is approved or rejected.</p>
      `;

      await sendEmail(user.email, "Booking Confirmation", customerEmailHtml);
    }

    // Send notification email to salon owner
    if (salonOwner) {
      const ownerEmailHtml = `
        <h2>New Booking Request</h2>
        <p>Hi ${salonOwner.firstname},</p>
        <p>You have received a new booking request.</p>
        <hr/>
        <h3>Booking Details:</h3>
        <p><strong>Customer:</strong> ${user?.firstname}</p>
        <p><strong>Service:</strong> ${service.name}</p>
        <p><strong>Date:</strong> ${bookingDate}</p>
        <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Price:</strong> $${service.price}</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
        <hr/>
        <p>Please log in to your dashboard to approve or reject this booking.</p>
      `;

      await sendEmail(salonOwner.email, "New Booking Request", ownerEmailHtml);
    }

    return res.status(201).json({
      success: true,
      message: "Booking created successfully. Awaiting salon owner approval.",
      booking: {
        id: newBooking._id,
        salonId: newBooking.salonId,
        serviceId: newBooking.serviceId,
        bookingDate: newBooking.bookingDate,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        status: newBooking.status,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to create booking",
    });
  }
};

// 4.4 Booking Management - Get booking history (Customer)
export const getBookingHistory = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const bookings = await Booking.find({
      userId: new mongoose.Types.ObjectId(req.user.userId),
    })
      .populate("salonId", "salonName location phone email")
      .populate("serviceId", "name description price duration")
      .sort({ bookingDate: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch booking history",
    });
  }
};

// 4.4 Booking Management - Cancel booking (Customer)
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate("userId")
      .populate("salonId");

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found",
      });
    }

    // Check if booking belongs to user
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: "You don't have permission to cancel this booking",
      });
    }

    // Check if booking can be cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      return res.status(400).json({
        error: "Booking is already cancelled",
      });
    }

    if (booking.status === BookingStatus.COMPLETED) {
      return res.status(400).json({
        error: "Cannot cancel completed booking",
      });
    }

    // Cancel booking
    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    // Send cancellation email to customer
    const user = await User.findById(req.user.userId);
    if (user) {
      const customerEmailHtml = `
        <h2>Booking Cancelled</h2>
        <p>Hi ${user.firstname},</p>
        <p>Your booking has been cancelled.</p>
        <hr/>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p>If you have any questions, please contact the salon.</p>
      `;

      await sendEmail(user.email, "Booking Cancelled", customerEmailHtml);
    }

    // Send cancellation notification to salon owner
    const salonOwner = await User.findById((booking.salonId as any).owner);
    if (salonOwner) {
      const ownerEmailHtml = `
        <h2>Booking Cancelled</h2>
        <p>Hi ${salonOwner.firstname},</p>
        <p>A customer has cancelled their booking.</p>
        <hr/>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
      `;

      await sendEmail(salonOwner.email, "Booking Cancelled", ownerEmailHtml);
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to cancel booking",
    });
  }
};

// 4.4 Booking Management - Reschedule booking (Customer)
export const rescheduleBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { newBookingDate, newStartTime } = req.body;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Validate input
    if (!newBookingDate || !newStartTime) {
      return res.status(400).json({
        error: "New booking date and start time are required",
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate("userId")
      .populate("serviceId")
      .populate("salonId");

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found",
      });
    }

    // Check if booking belongs to user
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: "You don't have permission to reschedule this booking",
      });
    }

    // Check if booking can be rescheduled
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      return res.status(400).json({
        error: "Cannot reschedule this booking",
      });
    }

    // Validate new date
    const newDateObj = new Date(newBookingDate);
    if (newDateObj < new Date()) {
      return res.status(400).json({
        error: "New booking date must be in the future",
      });
    }

    // Calculate new end time based on service duration
    const [hours, minutes] = newStartTime.split(":").map(Number);
    const endTimeDate = new Date();
    endTimeDate.setHours(hours, minutes + (booking.serviceId as any).duration);
    const newEndTime = `${String(endTimeDate.getHours()).padStart(2, "0")}:${String(
      endTimeDate.getMinutes()
    ).padStart(2, "0")}`;

    // Check for booking conflicts
    const existingBooking = await Booking.findOne({
      _id: { $ne: new mongoose.Types.ObjectId(bookingId as string) },
      salonId: booking.salonId,
      bookingDate: {
        $gte: new Date(newBookingDate + "T00:00:00"),
        $lte: new Date(newBookingDate + "T23:59:59"),
      },
      $or: [
        {
          startTime: { $lt: newEndTime },
          endTime: { $gt: newStartTime },
        },
      ],
      status: { $ne: BookingStatus.CANCELLED },
    });

    if (existingBooking) {
      return res.status(409).json({
        error: "New time slot is already booked",
      });
    }

    // Update booking
    const oldDate = booking.bookingDate;
    const oldStartTime = booking.startTime;

    booking.bookingDate = newDateObj;
    booking.startTime = newStartTime;
    booking.endTime = newEndTime;
    booking.status = BookingStatus.PENDING; // Reset to pending for approval
    await booking.save();

    // Send reschedule email to customer
    const user = await User.findById(req.user.userId);
    if (user) {
      const customerEmailHtml = `
        <h2>Booking Rescheduled</h2>
        <p>Hi ${user.firstname},</p>
        <p>Your booking has been rescheduled and is awaiting approval.</p>
        <hr/>
        <h3>Old Booking Details:</h3>
        <p><strong>Date:</strong> ${oldDate}</p>
        <p><strong>Time:</strong> ${oldStartTime}</p>
        <hr/>
        <h3>New Booking Details:</h3>
        <p><strong>Date:</strong> ${newBookingDate}</p>
        <p><strong>Time:</strong> ${newStartTime} - ${newEndTime}</p>
        <hr/>
        <p>The salon owner will review your reschedule request.</p>
      `;

      await sendEmail(user.email, "Booking Rescheduled", customerEmailHtml);
    }

    return res.status(200).json({
      success: true,
      message: "Booking rescheduled successfully. Awaiting approval.",
      booking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to reschedule booking",
    });
  }
};

// 4.5 Booking Approval - Get all bookings for a salon (Salon Owner)
export const getBookingsBySalon = async (req: AuthRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Check if salon exists and belongs to user
    const salon = await Salon.findOne({
      _id: new mongoose.Types.ObjectId(salonId as string),
      owner: new mongoose.Types.ObjectId(req.user.userId),
    });

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found or you don't have permission",
      });
    }

    // Get all bookings for salon
    const bookings = await Booking.find({
      salonId: new mongoose.Types.ObjectId(salonId as string),
    })
      .populate("userId", "firstname email")
      .populate("serviceId", "name price duration")
      .sort({ bookingDate: -1 });

    // Separate by status
    const pending = bookings.filter((b: IBooking) => b.status === BookingStatus.PENDING);
    const confirmed = bookings.filter((b: IBooking) => b.status === BookingStatus.CONFIRMED);
    const completed = bookings.filter((b: IBooking) => b.status === BookingStatus.COMPLETED);
    const cancelled = bookings.filter((b: IBooking) => b.status === BookingStatus.CANCELLED);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      summary: {
        pending: pending.length,
        confirmed: confirmed.length,
        completed: completed.length,
        cancelled: cancelled.length,
      },
      bookings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch bookings",
    });
  }
};

// 4.5 Booking Approval - Approve booking (Salon Owner)
export const approveBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate("userId")
      .populate("serviceId")
      .populate("salonId");

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found",
      });
    }

    // Check if salon belongs to user
    if ((booking.salonId as any).owner.toString() !== req.user.userId) {
      return res.status(403).json({
        error: "You don't have permission to approve this booking",
      });
    }

    // Check if booking is pending
    if (booking.status !== BookingStatus.PENDING) {
      return res.status(400).json({
        error: "Only pending bookings can be approved",
      });
    }

    // Approve booking
    booking.status = BookingStatus.CONFIRMED;
    await booking.save();

    // Send approval email to customer
    const user = await User.findById((booking.userId as any)._id);
    if (user) {
      const customerEmailHtml = `
        <h2>Booking Confirmed</h2>
        <p>Hi ${user.firstname},</p>
        <p>Great news! Your booking has been approved and confirmed.</p>
        <hr/>
        <h3>Booking Details:</h3>
        <p><strong>Salon:</strong> ${(booking.salonId as any).salonName}</p>
        <p><strong>Service:</strong> ${(booking.serviceId as any).name}</p>
        <p><strong>Date:</strong> ${booking.bookingDate.toDateString()}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Price:</strong> $${(booking.serviceId as any).price}</p>
        <hr/>
        <p>Thank you for booking with us!</p>
      `;

      await sendEmail(user.email, "Booking Confirmed", customerEmailHtml);
    }

    return res.status(200).json({
      success: true,
      message: "Booking approved successfully",
      booking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to approve booking",
    });
  }
};

// 4.5 Booking Approval - Reject booking (Salon Owner)
export const rejectBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { rejectionReason } = req.body;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate("userId")
      .populate("serviceId")
      .populate("salonId");

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found",
      });
    }

    // Check if salon belongs to user
    if ((booking.salonId as any).owner.toString() !== req.user.userId) {
      return res.status(403).json({
        error: "You don't have permission to reject this booking",
      });
    }

    // Check if booking is pending
    if (booking.status !== BookingStatus.PENDING) {
      return res.status(400).json({
        error: "Only pending bookings can be rejected",
      });
    }

    // Reject booking
    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    // Send rejection email to customer
    const user = await User.findById((booking.userId as any)._id);
    if (user) {
      const customerEmailHtml = `
        <h2>Booking Rejected</h2>
        <p>Hi ${user.firstname},</p>
        <p>Unfortunately, your booking has been rejected.</p>
        <hr/>
        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
        <hr/>
        <p>Please feel free to try another time slot or contact the salon for more information.</p>
      `;

      await sendEmail(user.email, "Booking Rejected", customerEmailHtml);
    }

    return res.status(200).json({
      success: true,
      message: "Booking rejected successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to reject booking",
    });
  }
};

// Get booking details
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate("userId", "firstname email")
      .populate("serviceId", "name description price duration")
      .populate("salonId", "salonName location phone email");

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found",
      });
    }

    // Check permissions - user can view their own booking or salon owner can view bookings for their salon
    const isCustomer = booking.userId.toString() === req.user.userId;
    const isSalonOwner =
      (booking.salonId as any).owner && (booking.salonId as any).owner.toString() === req.user.userId;

    if (!isCustomer && !isSalonOwner) {
      return res.status(403).json({
        error: "You don't have permission to view this booking",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch booking",
    });
  }
};
