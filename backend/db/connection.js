import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import config from "../config/variables.js";
import { buildMongoUri, getMongoConnectionOptions } from "./mongo-connection-config.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      buildMongoUri(config.mongodbUri, DB_NAME),
      getMongoConnectionOptions(config)
    );
    console.log(`DB Connect to ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("Error While Connect the DataBase ", error.message);
    process.exit(1);
  }
};

export default connectDB;
