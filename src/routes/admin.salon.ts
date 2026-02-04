import express from "express";
import { 
  getAllSalonsForAdmin,
  approveSalon,
  blockSalon,
  reactivateSalon,
  getSalonDetailsForAdmin
} from "../controller/Admin/admin.salon.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../model/user.model";

const AdminSalonRoute = express.Router();

// All routes require authentication and admin role
AdminSalonRoute.use(authenticate, authorize(UserRole.ADMIN));

// Get all salons for review (with optional status filter)
AdminSalonRoute.get("/", getAllSalonsForAdmin);

// Get specific salon details
AdminSalonRoute.get("/:id", getSalonDetailsForAdmin);

// Approve a salon
AdminSalonRoute.patch("/:id/approve", approveSalon);

// Block a salon
AdminSalonRoute.patch("/:id/block", blockSalon);

// Reactivate a salon (set to pending)
AdminSalonRoute.patch("/:id/reactivate", reactivateSalon);

export default AdminSalonRoute;
