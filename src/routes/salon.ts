import  express  from "express";

import { 
  createSalon, 
  getSalon, 
  getSalonById, 
  deleteSalon,
  setWorkingHours,
  getWorkingHours,
  addHoliday,
  getHolidays,
  deleteHoliday
} from "../controller/SalonOwner/salon.controller";
import { authenticate } from "../middleware/auth.middleware";


const SalonRoute=express.Router();

// Salon CRUD operations
SalonRoute.post("/", authenticate, createSalon);
SalonRoute.get("/", getSalon); // Public access

// Working Hours Management (must be before /:id route)
SalonRoute.put("/:id/working-hours", authenticate, setWorkingHours);
SalonRoute.get("/:id/working-hours", getWorkingHours); // Public access

// Holiday Management (must be before /:id route)
SalonRoute.post("/:id/holidays", authenticate, addHoliday);
SalonRoute.get("/:id/holidays", authenticate, getHolidays);
SalonRoute.delete("/:id/holidays/:holidayId", authenticate, deleteHoliday);

// Generic ID routes (must be last)
SalonRoute.get("/:id", getSalonById); // Public access
SalonRoute.delete("/:id", authenticate, deleteSalon);

export default SalonRoute;