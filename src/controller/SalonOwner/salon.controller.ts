import { Request, Response } from "express";
import Salon from "../../model/Salon/salon.model";
import { error } from "node:console";

export const createSalon = async (req: Request, res: Response) => {
  try {
    const { salonName, location } = req.body;

    // Validate input
    if (!salonName || !location) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // Create salon
    const newSalon = await Salon.create({
      salonName,
      location,
    });

    return res.status(201).json({
      message: "Salon created successfully",
      salon: {
        id: newSalon._id,
        name: newSalon.salonName,
        location: newSalon.location,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to create salon",
    });
  }
};


export const getSalon = async (req: Request, res: Response) => {
  try {
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

export const getSalonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Salon ID is required",
      });
    }

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



export async  function deleteSalon(req:Request , res:Response){
    try{
        const {id} = req.params;
        const salon= await Salon.findById(id);
        if(!salon){
            return res.status(404).json({error : "Salon not found"});
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