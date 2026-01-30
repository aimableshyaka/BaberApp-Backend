import mongoose,{Schema,Document} from "mongoose";
import bcrypt from "bcryptjs";

export enum UserRole {
    CUSTOMER = "Customer",
    SALON_OWNER = "Salon Owner",
    ADMIN = "Admin"
}

export interface IUser extends Document{
    firstname:string,
    email:string,
    password:string,
    role: UserRole,
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    comparePassword(password: string): Promise<boolean>;
}

 
const UserSchema = new Schema<IUser>(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // never return password in queries
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      required: true,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);
// ✅ pre-save hook: let TS infer `next`
UserSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ✅ compare password method
UserSchema.methods.comparePassword = async function (
  this: IUser,
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);