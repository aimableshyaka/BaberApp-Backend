import express from "express";
import { Request , Response} from "express";
import {UserRouter} from "./routes/users";
import {ProtectedRouter} from "./routes/protected";
const app =express();

app.use(express.json());

app.get("/",(req:Request ,res:Response)=>{
    return res.send("welcome to my App");
})

app.use("/api/users",UserRouter);
app.use("/api/protected", ProtectedRouter);

export default app;