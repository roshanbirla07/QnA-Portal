import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import config from "../stageconfig.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${config.mongodbUri}/${DB_NAME}`
    );
    console.log(`DB Connect to ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("Error While Connect the DataBase ", error.message);
    process.exit(1);
  }
};

export default connectDB;
