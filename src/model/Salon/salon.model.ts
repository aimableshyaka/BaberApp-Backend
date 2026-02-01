import mongoose,{Schema,Document} from "mongoose";
import bcrypt from "bcryptjs"

export interface ISalon extends Document {
      salonName:string,
      location:string,
    //   iActive:{type: Boolean ,default:true}
}
export const SalonSchema = new Schema<ISalon>(
    {
        salonName:{
            type:String,
            required:true,
            trim:true
        },
        location:{
            type:String,
            required:true,
            trim:true,
        }
    }
);
export default mongoose.model<ISalon>("Salon", SalonSchema);