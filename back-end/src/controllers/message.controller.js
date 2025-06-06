import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getUsers controller", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getAllMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getAllMessages controller", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id; // my id = sender id

    const messages = await Message.find({
      $or: [
        {
          senderId: senderId,
          receiverId: userToChatId,
        },
        {
          senderId: userToChatId,
          receiverId: senderId,
        },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req?.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id; // my id = sender id

    let imageUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;

    const message = await Message.findById(messageId);

    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);

    const deleteMessage = await Message.findByIdAndDelete(messageId);
    if (!deleteMessage) {
      return res.status(400).json({
        message: "Message not found or already deleted",
      });
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", messageId);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleteMessage controller", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
