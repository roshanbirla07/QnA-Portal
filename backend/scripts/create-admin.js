import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import connectDB from "../db/connection.js";
import User from "../schemas/user.schema.js";

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters");
  process.exit(1);
}

const main = async () => {
  try {
    await connectDB();

    const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email: normalizedEmail });

    if (existingAdmin) {
      existingAdmin.roleType = "admin";
      if (process.env.ADMIN_RESET_PASSWORD === "true") {
        existingAdmin.password = ADMIN_PASSWORD;
      }
      await existingAdmin.save();
      console.log(`Admin user updated: ${normalizedEmail}`);
    } else {
      await User.create({
        email: normalizedEmail,
        password: ADMIN_PASSWORD,
        roleType: "admin",
      });
      console.log(`Admin user created: ${normalizedEmail}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error(`Failed to seed admin: ${error.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

main();
