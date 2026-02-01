import express from "express";
import cors from "cors";
import { Request , Response} from "express";
import {UserRouter} from "./routes/users";
import {ProtectedRouter} from "./routes/protected";
import SalonRoute from "./routes/salon";

const app = express();

// ✅ Add CORS configuration BEFORE routes
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use("/api/salon",SalonRoute);
app.get("/",(req:Request ,res:Response)=>{
    return res.send("welcome to my App");
})

app.use("/api/users",UserRouter);
app.use("/api/protected", ProtectedRouter);

export default app;