import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import app from "./app";
import connectDb from "./config/db";

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

dotenv.config({})
const port = Number(process.env.PORT) || 3000;
connectDb();
app.listen(port, () => {
  console.log(`Server is Running  on port ${port}`)
})
