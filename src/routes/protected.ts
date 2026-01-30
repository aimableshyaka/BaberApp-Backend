import express from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.middleware";
import { UserRole } from "../model/user.model";

const ProtectedRouter = express.Router();

// Example: Protected route - only authenticated users
ProtectedRouter.get("/profile", authenticate, (req: AuthRequest, res) => {
    res.json({
        message: "This is a protected route",
        user: req.user,
    });
});

// Example: Admin only route
ProtectedRouter.get("/admin/dashboard", authenticate, authorize(UserRole.ADMIN), (req: AuthRequest, res) => {
    res.json({
        message: "Welcome to Admin Dashboard",
        user: req.user,
    });
});

// Example: Salon Owner and Admin can access
ProtectedRouter.get("/salon/manage", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), (req: AuthRequest, res) => {
    res.json({
        message: "Salon Management Area",
        user: req.user,
    });
});

export { ProtectedRouter };
