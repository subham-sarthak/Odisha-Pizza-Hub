import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema(
  {
    label: { type: String, enum: ["S", "M", "L", "XL"], required: true },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const addonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    type: { type: String, enum: ["veg", "nonveg"], required: true, index: true },
    sizes: { type: [sizeSchema], required: true },
    addons: { type: [addonSchema], default: [] },
    stock: { type: Number, default: 0 },
    image: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
