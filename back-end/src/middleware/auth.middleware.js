import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = res.cookie.jwt;
    if (!token) {
      res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const decodedToken = jwt.verify(token , process.env.JWT_SECRET_KEY)

    if(!decodedToken){
        
    }
  } catch (error) {}
};
