import mongoose from "mongoose"; 
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  roleType: { type: String, default: "user", enum: ["user", "admin"] },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true, maxlength: 40 },
  displayName: { type: String, trim: true, maxlength: 80 },
  avatar: String,
  bio: { type: String, trim: true, maxlength: 500 },
  headline: { type: String, trim: true, maxlength: 160 },
  location: { type: String, trim: true, maxlength: 120 },
  website: String,
  github: String,
  linkedin: String,
  reputation: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
