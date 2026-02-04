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

// Create a new service for a salon (requires authentication)
ServiceRoute.post("/:salonId", authenticate, createService);

// Get all active services for a salon (public access)
ServiceRoute.get("/:salonId", getServicesBySalon);

// Get all services (including deleted) - requires authentication
ServiceRoute.get("/:salonId/all", authenticate, getAllServicesForSalon);

// Get a specific service (public access)
ServiceRoute.get("/:salonId/:serviceId", getServiceById);

// Update a service (requires authentication)
ServiceRoute.put("/:salonId/:serviceId", authenticate, updateService);

// Delete (soft delete) a service (requires authentication)
ServiceRoute.delete("/:salonId/:serviceId", authenticate, deleteService);

export default ServiceRoute;
