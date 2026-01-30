import dotenv from "dotenv";
import express from "express";
import app from "./app";
import connectDb from "./config/db";


dotenv.config({})
const port = Number(process.env.PORT) || 3000;
connectDb();
app.listen(port, () => {
  console.log(`Server is Running  on port ${port}`)
})
