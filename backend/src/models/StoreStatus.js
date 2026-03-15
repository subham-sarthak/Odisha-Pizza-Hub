import mongoose from "mongoose";

const storeStatusSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "primary",
      unique: true,
      immutable: true
    },
    isOpen: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const StoreStatus = mongoose.model("StoreStatus", storeStatusSchema);

export default StoreStatus;
