import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import Salon, { SalonStatus } from "../../model/Salon/salon.model";
import mongoose from "mongoose";

// Get all salons for admin review (all statuses)
export const getAllSalonsForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    
    const filter: any = {};
    if (status && Object.values(SalonStatus).includes(status as SalonStatus)) {
      filter.status = status;
    }

    const salons = await Salon.find(filter).populate('owner', 'firstname email').sort({ createdAt: -1 });

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

// Approve a salon
export const approveSalon = async (req: AuthRequest, res: Response) => {
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

    if (salon.status === SalonStatus.APPROVED) {
      return res.status(400).json({
        error: "Salon is already approved",
      });
    }

    salon.status = SalonStatus.APPROVED;
    await salon.save();

    return res.status(200).json({
      success: true,
      message: "Salon approved successfully",
      salon,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to approve salon",
    });
  }
};

// Reject/Block a salon
export const blockSalon = async (req: AuthRequest, res: Response) => {
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

    salon.status = SalonStatus.BLOCKED;
    await salon.save();

    return res.status(200).json({
      success: true,
      message: "Salon blocked successfully",
      salon,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to block salon",
    });
  }
};

// Reactivate a blocked salon (set to pending for re-review)
export const reactivateSalon = async (req: AuthRequest, res: Response) => {
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

    salon.status = SalonStatus.PENDING;
    await salon.save();

    return res.status(200).json({
      success: true,
      message: "Salon reactivated and set to pending for review",
      salon,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to reactivate salon",
    });
  }
};

// Get salon details by ID (for admin)
export const getSalonDetailsForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Salon ID is required",
      });
    }

    const salon = await Salon.findById(id).populate('owner', 'firstname email role');

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
      error: "Failed to fetch salon details",
    });
  }
};
