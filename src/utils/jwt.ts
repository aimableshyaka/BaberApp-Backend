import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "../model/user.model";
import crypto from "crypto";

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.verify(token, secret) as JWTPayload;
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

