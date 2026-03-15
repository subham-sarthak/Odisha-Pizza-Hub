import bcrypt from "bcrypt";
import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true, required: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["admin", "customer"], default: "customer" },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
    otpCode: { type: String, default: null, select: false },
    otpExpires: { type: Date, default: null, select: false },
    rewardPoints: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, required: true },
    refreshTokens: { type: [refreshTokenSchema], default: [] }
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
