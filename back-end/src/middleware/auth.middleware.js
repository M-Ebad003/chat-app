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

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decodedToken) {
      res.status(401).json({
        message: "Invalid Token",
      });
    }
    const user = await User.findById(decodedToken.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protected Route", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
