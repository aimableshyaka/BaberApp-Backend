import express from "express";
import {
  createService,
  getServicesBySalon,
  getServiceById,
  updateService,
  deleteService,
  getAllServicesForSalon,
} from "../controller/SalonOwner/service.controller";
import { authenticate } from "../middleware/auth.middleware";

const ServiceRoute = express.Router();

// All routes require authentication
ServiceRoute.use(authenticate);

// Create a new service for a salon
ServiceRoute.post("/:salonId", createService);

// Get all active services for a salon
ServiceRoute.get("/:salonId", getServicesBySalon);

// Get all services (including deleted)
ServiceRoute.get("/:salonId/all", getAllServicesForSalon);

// Get a specific service
ServiceRoute.get("/:salonId/:serviceId", getServiceById);

// Update a service
ServiceRoute.put("/:salonId/:serviceId", updateService);

// Delete (soft delete) a service
ServiceRoute.delete("/:salonId/:serviceId", deleteService);

export default ServiceRoute;
