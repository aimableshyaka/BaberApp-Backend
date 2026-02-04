import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import Service from "../../model/Service/service.model";
import Salon from "../../model/Salon/salon.model";
import mongoose from "mongoose";

// Create a new service
export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const salonId = req.params.salonId as string;
    const { name, description, price, duration } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Validate input
    if (!salonId || !name || !description || price === undefined || !duration) {
      return res.status(400).json({
        error: "All fields are required (name, description, price, duration)",
      });
    }

    // Validate price and duration
    if (price < 0 || duration < 1) {
      return res.status(400).json({
        error: "Price must be >= 0 and duration must be >= 1 minute",
      });
    }

    // Check if salon exists and belongs to the user
    const salon = await Salon.findOne({
      _id: new mongoose.Types.ObjectId(salonId),
      owner: new mongoose.Types.ObjectId(req.user.userId),
    });

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found or you don't have permission",
      });
    }

    // Create service
    const newService = await Service.create({
      salonId: new mongoose.Types.ObjectId(salonId),
      name,
      description,
      price,
      duration,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service: newService,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to create service",
    });
  }
};

// Get all services for a salon
export const getServicesBySalon = async (req: AuthRequest, res: Response) => {
  try {
    const salonId = req.params.salonId as string;

    // Public access - Check if salon exists
    const salon = await Salon.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found",
      });
    }

    // Get all non-deleted services for this salon
    const services = await Service.find({
      salonId: new mongoose.Types.ObjectId(salonId),
      isDeleted: false,
    });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch services",
    });
  }
};

// Get a specific service
export const getServiceById = async (req: AuthRequest, res: Response) => {
  try {
    const salonId = req.params.salonId as string;
    const serviceId = req.params.serviceId as string;

    // Public access - Check if salon exists
    const salon = await Salon.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found",
      });
    }

    const service = await Service.findOne({
      _id: new mongoose.Types.ObjectId(serviceId),
      salonId: new mongoose.Types.ObjectId(salonId),
      isDeleted: false,
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch service",
    });
  }
};

// Update service details
export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const salonId = req.params.salonId as string;
    const serviceId = req.params.serviceId as string;
    const { name, description, price, duration } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Check if salon exists and belongs to the user
    const salon = await Salon.findOne({
      _id: new mongoose.Types.ObjectId(salonId),
      owner: new mongoose.Types.ObjectId(req.user.userId),
    });

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found or you don't have permission",
      });
    }

    // Find and update service
    const service = await Service.findOne({
      _id: new mongoose.Types.ObjectId(serviceId),
      salonId: new mongoose.Types.ObjectId(salonId),
      isDeleted: false,
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    // Update fields if provided
    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({
          error: "Price must be >= 0",
        });
      }
      service.price = price;
    }
    if (duration !== undefined) {
      if (duration < 1) {
        return res.status(400).json({
          error: "Duration must be >= 1 minute",
        });
      }
      service.duration = duration;
    }

    await service.save();

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to update service",
    });
  }
};

// Soft delete a service
export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const salonId = req.params.salonId as string;
    const serviceId = req.params.serviceId as string;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Check if salon exists and belongs to the user
    const salon = await Salon.findOne({
      _id: new mongoose.Types.ObjectId(salonId),
      owner: new mongoose.Types.ObjectId(req.user.userId),
    });

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found or you don't have permission",
      });
    }

    // Find and soft delete service
    const service = await Service.findOne({
      _id: new mongoose.Types.ObjectId(serviceId),
      salonId: new mongoose.Types.ObjectId(salonId),
      isDeleted: false,
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    service.isDeleted = true;
    await service.save();

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to delete service",
    });
  }
};

// Get all services for a salon (including deleted ones - for admin/owner reference)
export const getAllServicesForSalon = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const salonId = req.params.salonId as string;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Check if salon exists and belongs to the user
    const salon = await Salon.findOne({
      _id: new mongoose.Types.ObjectId(salonId),
      owner: new mongoose.Types.ObjectId(req.user.userId),
    });

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found or you don't have permission",
      });
    }

    // Get all services (including deleted)
    const services = await Service.find({
      salonId: new mongoose.Types.ObjectId(salonId),
    });

    const activeCount = services.filter((s) => !s.isDeleted).length;
    const deletedCount = services.filter((s) => s.isDeleted).length;

    return res.status(200).json({
      success: true,
      count: services.length,
      activeCount,
      deletedCount,
      services,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch services",
    });
  }
};
