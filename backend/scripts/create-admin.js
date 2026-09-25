import mongoose from "mongoose";
import connectDB from "../db/connection.js";
import User from "../schemas/user.schema.js";
import config from "../stageconfig.js";

const ADMIN_EMAIL = config.adminEmail;
const ADMIN_PASSWORD = config.adminPassword;

if (
  !ADMIN_EMAIL ||
  !ADMIN_PASSWORD ||
  ADMIN_EMAIL.startsWith("REPLACE_WITH_") ||
  ADMIN_PASSWORD.startsWith("REPLACE_WITH_")
) {
  console.error("Set adminEmail and adminPassword in backend/stageconfig.js");
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 12) {
  console.error("adminPassword must be at least 12 characters");
  process.exit(1);
}

const main = async () => {
  try {
    await connectDB();

    const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email: normalizedEmail });

    if (existingAdmin) {
      existingAdmin.roleType = "admin";
      if (config.adminResetPassword) {
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
