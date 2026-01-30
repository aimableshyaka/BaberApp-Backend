import mongoose from "mongoose";

const connectDb = async ()=>{
     try
      {
        const mongoURI= process.env.MONGODB_URI;
        if(!mongoURI){
            throw new Error("DB is desfined in envirnoment variable");
        }
        await mongoose.connect(mongoURI);
        console.log("Mongo Db Connected successfull");

      }
     catch(error){
        console.error(`Mongo connection Error ${error}`);
     }
}
export default connectDb;