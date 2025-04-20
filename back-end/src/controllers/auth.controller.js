import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 digits" });
    }

    const user = await User.findOne({ email });
    if (user)
      return res.status(400).json({
        message: "Email already exists",
      });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      fullName,
      password: hashedPassword,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({
        message: "Invalid Credentials",
      });
    }
  } catch (error) {
    console.log("error in sign-up controller", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user?.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }

    generateToken(user?._id, res);

    res.status(200).json({
      message: "Login Successfully",
      _id: user?._id,
      fullName: user?.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("error in sign-in controller", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
    });
    res.status(200).json({ message: "Logout Successfully" });
  } catch (error) {
    console.log("error in sign-up controller", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  const { profilePic } = req.body;
  try {
    const userId = req.user._id;
    if (!profilePic) {
      res.status(400).json({
        message: "Profile pic is required",
      });
    }
    const cloudinaryRes = await cloudinary.uploader.upload(profilePic);
    const updateUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic: cloudinaryRes.secure_url,
      },
      { new: true }
    );

    return res.status(200).json(updateUser);
  } catch (error) {
    console.log("error while updating profile pic", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const checAuth = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("error in auth controller", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
