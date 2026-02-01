import  express  from "express";

import { createSalon , getSalon , getSalonById ,deleteSalon} from "../controller/SalonOwner/salon.controller";


const SalonRoute=express.Router();

SalonRoute.post("/",createSalon);
SalonRoute.get("/",getSalon);
SalonRoute.get("/:id",getSalonById);
SalonRoute.delete("/:id",deleteSalon)

export default SalonRoute;