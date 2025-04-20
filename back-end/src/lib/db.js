import mongoose from "mongoose";

export const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDb Connected Successfully");
  } catch (error) {
    console.log("MongoDb Connection error", error);
  }
};
