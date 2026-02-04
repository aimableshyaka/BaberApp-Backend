import mongoose,{Schema,Document} from "mongoose";
import bcrypt from "bcryptjs"

export enum SalonStatus {
    PENDING = "pending",
    APPROVED = "approved",
    BLOCKED = "blocked"
}

export interface IWorkingHours {
    day: string; // e.g., "Monday", "Tuesday"
    isOpen: boolean;
    openingTime?: string; // e.g., "09:00"
    closingTime?: string; // e.g., "18:00"
}

export interface IHoliday {
    date: Date;
    description: string;
}

export interface ISalon extends Document {
      salonName:string,
      location:string,
      phone:string,
      email:string,
      description?:string,
      status: SalonStatus,
      owner: mongoose.Types.ObjectId,
      workingHours: IWorkingHours[],
      holidays: IHoliday[],
      createdAt: Date,
      updatedAt: Date,
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
        },
        phone:{
            type:String,
            required:true,
            trim:true,
        },
        email:{
            type:String,
            required:true,
            trim:true,
            lowercase:true,
        },
        description:{
            type:String,
            trim:true,
        },
        status:{
            type:String,
            enum: Object.values(SalonStatus),
            default: SalonStatus.PENDING,
            required:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:'User',
            required:true
        },
        workingHours:[{
            day: {
                type: String,
                required: true,
                enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            },
            isOpen: {
                type: Boolean,
                default: true
            },
            openingTime: {
                type: String, // Format: "HH:MM"
            },
            closingTime: {
                type: String, // Format: "HH:MM"
            }
        }],
        holidays:[{
            date: {
                type: Date,
                required: true
            },
            description: {
                type: String,
                required: true
            }
        }]
    },
    {
        timestamps: true
    }
);
export default mongoose.model<ISalon>("Salon", SalonSchema);