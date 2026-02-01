import express  from "express";
import {createUser, login, forgotPassword, resetPassword} from "../controller/user.controller";


const UserRouter=express.Router();

UserRouter.post("/", createUser);
UserRouter.post("/login", login);
UserRouter.post("/forgot-password", forgotPassword);
UserRouter.post("/reset-password", resetPassword);
UserRouter.get("/reset-password/redirect", (req, res) => {
    const { token, email } = req.query;
    
    if (!token || !email) {
        return res.status(400).send("Missing token or email");
    }
    
    // Redirect to Expo app with deep link
    const expoUrl = `exp://192.168.1.97:8081/reset-password?token=${token}&email=${email}`;
    res.redirect(expoUrl);
});

export {UserRouter};