import type { Request , Response } from "express";
import User, { UserRole } from "../model/user.model";
import { generateToken, generateResetToken } from "../utils/jwt";
import { sendEmail } from "../utils/sendEmail";
import crypto from "crypto";
import bcrypt from "bcryptjs";



async function  createUser(req:Request ,res:Response){
    try{
         const {firstname ,email,password, role} =req.body;
         if(!firstname || !email || !password ){
            return res.status(400).json({
                error:"All fields are required"
            });
         }

         // Check if user already exists
         const existingUser = await User.findOne({ email });
         if (existingUser) {
            return res.status(400).json({
                error: "User with this email already exists"
            });
         }

         // Validate role if provided
         const userRole = role && Object.values(UserRole).includes(role) 
            ? role 
            : UserRole.CUSTOMER;

         const newUser=new User({
            firstname,
            email,
            password,
            role: userRole,
         });
            await newUser.save();

            // Generate JWT token
            const token = generateToken({
               userId: newUser._id.toString(),
               email: newUser.email,
               role: newUser.role,
            });

            return res.status(201).json({
                message: "User created successfully",
                user: {
                     id: newUser._id,
                     firstname: newUser.firstname,
                     email: newUser.email,
                     role: newUser.role,
                },
                token,
            });
    }
    catch(error){
        console.error("Signup error:", error);
        return res.status(500).json({
          error: "Failed to create user",
        });
    }
} 

async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        // Find user and include password field
        const user = await User.findOne({ email }).select("+password");
        
        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        // Generate JWT token
        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                firstname: user.firstname,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            error: "Failed to login",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

async function forgotPassword(req: Request, res: Response) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: "Email is required"
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            // For security, return success even if user doesn't exist
            return res.status(200).json({
                message: "If the email exists, a password reset link has been sent"
            });
        }

        // Generate reset token
        const resetToken = generateResetToken();
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        // Save token and expiration to database (expires in 1 hour)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        // Create reset URL - Use HTTP redirect link that will open Expo app
        const resetUrl = `http://192.168.1.97:3000/api/users/reset-password/redirect?token=${resetToken}&email=${email}`;

        // Email template - Simple format that works with Gmail
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="background-color: #ffffff; max-width: 600px; margin: 20px auto; padding: 40px; border-radius: 8px;">
        <h1 style="color: #333333; margin: 0 0 20px 0;">Password Reset Request</h1>
        
        <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px;">
            You requested to reset your password. Click the link below to proceed:
        </p>
        
        <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        
        <p style="color: #666666; margin: 20px 0; font-size: 14px;">
            If the button doesn't work, copy and paste this link in your browser:
        </p>
        
        <p style="background-color: #f9f9f9; padding: 12px; border-left: 4px solid #007bff; word-wrap: break-word; margin: 0 0 20px 0;">
            <a href="${resetUrl}" style="color: #007bff; text-decoration: none; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <p style="color: #999999; margin: 20px 0 0 0; font-size: 12px;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
        
        <p style="color: #cccccc; margin: 0; font-size: 11px; text-align: center;">
            This is an automated message, please do not reply to this email.
        </p>
    </div>
</body>
</html>
        `;

        // Send email
        await sendEmail(user.email, "Password Reset Request", html);

        return res.status(200).json({
            message: "If the email exists, a password reset link has been sent"
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            error: "Failed to process password reset request",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

async function resetPassword(req: Request, res: Response) {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({
                error: "Email, token, and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long"
            });
        }

        // Hash the token to compare with stored token
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find user with matching token and email
        const user = await User.findOne({
            email,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() } // Token not expired
        }).select("+resetPasswordToken +resetPasswordExpires");

        if (!user) {
            return res.status(400).json({
                error: "Invalid or expired password reset token"
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        await User.updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
            }
        );

        // Send confirmation email
        const html = `
            <html>
                <head>
                    <meta charset="UTF-8">
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #28a745;">✓ Password Reset Successful</h2>
                        <p>Your password has been successfully reset.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0; color: #666;">
                                You can now log in with your new password.
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        
                        <p style="color: #999; font-size: 12px;">
                            <strong>Security Note:</strong> If you didn't make this change, please contact support immediately at your earliest convenience.
                        </p>
                    </div>
                </body>
            </html>
        `;
        await sendEmail(user.email, "Password Reset Successful", html);

        return res.status(200).json({
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            error: "Failed to reset password",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

export { createUser, login, forgotPassword, resetPassword };