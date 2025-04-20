import User from "../models/user.model.js";
import Message from "../models/message.model.js";

export const getUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.findById({
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

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params();
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
    res.status(200).json(messages)
  } catch (error) {
    console.log("Error in getMessages controller", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
