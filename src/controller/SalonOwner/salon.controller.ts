import { Request, Response } from "express";
import Salon from "../../model/Salon/salon.model";
import { error } from "node:console";
import { AuthRequest } from "../../middleware/auth.middleware";
import mongoose from "mongoose";

export const createSalon = async (req: AuthRequest, res: Response) => {
  try {
    const { salonName, location, phone, email, description } = req.body;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Validate input
    if (!salonName || !location || !phone || !email) {
      return res.status(400).json({
        error: "All fields are required (salonName, location, phone, email)",
      });
    }

    // Create salon with owner
    const newSalon = await Salon.create({
      salonName,
      location,
      phone,
      email,
      description,
      owner: new mongoose.Types.ObjectId(req.user.userId),
    });

    return res.status(201).json({
      message: "Salon created successfully and pending approval",
      salon: {
        id: newSalon._id,
        name: newSalon.salonName,
        location: newSalon.location,
        phone: newSalon.phone,
        email: newSalon.email,
        description: newSalon.description,
        status: newSalon.status,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to create salon",
    });
  }
};


export const getSalon = async (req: AuthRequest, res: Response) => {
  try {
    // Get all salons (public access)
    const salons = await Salon.find();

    return res.status(200).json({
      success: true,
      count: salons.length,
      salons,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch salons",
    });
  }
};

export const getSalonById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Salon ID is required",
      });
    }

    // Allow anyone to view any salon (public access)
    const salon = await Salon.findById(id);

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found",
      });
    }

    return res.status(200).json({
      success: true,
      salon,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch salon",
    });
  }
};



export async  function deleteSalon(req:AuthRequest , res:Response){
    try{
        const {id} = req.params;

        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                error: "Valid Salon ID is required",
            });
        }

        // Only allow user to delete their own salon
        const salon= await Salon.findOne({ _id: new mongoose.Types.ObjectId(id), owner: new mongoose.Types.ObjectId(req.user.userId) });
        if(!salon){
            return res.status(404).json({error : "Salon not found or you don't have permission to delete it"});
        }
        const deleteSalon=await Salon.findByIdAndDelete(id);
        return res.status(200).json({message:"Salon Delete",salon:deleteSalon})

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            error: "Failed to Delete Salon"
        })
    }
}

// Set or Update Working Hours for a Salon
export const setWorkingHours = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { workingHours } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!id || !workingHours || !Array.isArray(workingHours)) {
      return res.status(400).json({
        error: "Salon ID and valid working hours array are required",
      });
    }

    // Validate working hours structure
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for (const wh of workingHours) {
      if (!validDays.includes(wh.day)) {
        return res.status(400).json({
          error: `Invalid day: ${wh.day}. Must be one of ${validDays.join(", ")}`
        });
      }
    }

    const salon = await Salon.findOne({ 
      _id: new mongoose.Types.ObjectId(id), 
      owner: new mongoose.Types.ObjectId(req.user.userId) 
    });

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found or you don't have permission",
      });
    }

    salon.workingHours = workingHours;
    await salon.save();

    return res.status(200).json({
      success: true,
      message: "Working hours updated successfully",
      workingHours: salon.workingHours,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to update working hours",
    });
  }
};

// Get Working Hours for a Salon
export const getWorkingHours = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    // Public access - anyone can view working hours
    const salon = await Salon.findById(id);

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found",
      });
    }

    return res.status(200).json({
      success: true,
      workingHours: salon.workingHours || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch working hours",
    });
  }
};

// Add a Holiday
export const addHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { date, description } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!id || !date || !description) {
      return res.status(400).json({
        error: "Salon ID, date, and description are required",
      });
    }

    const salon = await Salon.findOne({ 
      _id: new mongoose.Types.ObjectId(id), 
      owner: new mongoose.Types.ObjectId(req.user.userId) 
    });

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found or you don't have permission",
      });
    }

    salon.holidays.push({ date: new Date(date), description });
    await salon.save();

    return res.status(200).json({
      success: true,
      message: "Holiday added successfully",
      holidays: salon.holidays,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to add holiday",
    });
  }
};

// Get Holidays for a Salon
export const getHolidays = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const salon = await Salon.findOne({ 
      _id: new mongoose.Types.ObjectId(id), 
      owner: new mongoose.Types.ObjectId(req.user.userId) 
    });

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found or you don't have permission",
      });
    }

    return res.status(200).json({
      success: true,
      holidays: salon.holidays || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch holidays",
    });
  }
};

// Delete a Holiday
export const deleteHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const holidayId = req.params.holidayId as string;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!id || !holidayId) {
      return res.status(400).json({
        error: "Salon ID and holiday ID are required",
      });
    }

    const salon = await Salon.findOne({ 
      _id: new mongoose.Types.ObjectId(id), 
      owner: new mongoose.Types.ObjectId(req.user.userId) 
    });

    if (!salon) {
      return res.status(404).json({
        error: "Salon not found or you don't have permission",
      });
    }

    salon.holidays = salon.holidays.filter(
      (holiday: any) => holiday._id.toString() !== holidayId
    );
    await salon.save();

    return res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
      holidays: salon.holidays,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to delete holiday",
    });
  }
};