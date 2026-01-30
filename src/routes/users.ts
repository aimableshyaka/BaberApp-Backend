import express  from "express";
import {createUser, login, forgotPassword, resetPassword} from "../controller/user.controller";


const UserRouter=express.Router();

UserRouter.post("/", createUser);
UserRouter.post("/login", login);
UserRouter.post("/forgot-password", forgotPassword);
UserRouter.post("/reset-password", resetPassword);

export {UserRouter};