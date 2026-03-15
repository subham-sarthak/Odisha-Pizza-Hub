import dotenv from "dotenv";
import mongoose from "mongoose";
import { menuData } from "../src/data/menuData.js";
import Coupon from "../src/models/Coupon.js";
import Offer from "../src/models/Offer.js";
import Product from "../src/models/Product.js";
import User from "../src/models/User.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    Offer.deleteMany({})
  ]);

  await Product.insertMany(menuData);

  const adminEmail = "admin@odishapizza.com";
  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    await User.create({
      name: "Odisha Pizza Hub Admin",
      email: adminEmail,
      phone: "9990001111",
      password: "admin123",
      role: "admin",
      referralCode: "ADMIN001",
      emailVerified: true
    });
  } else if (!adminExists.emailVerified) {
    adminExists.emailVerified = true;
    await adminExists.save({ validateBeforeSave: false });
  }

  await Coupon.insertMany([
    {
      code: "ODISHA20",
      discountPercent: 20,
      minOrderValue: 299,
      maxDiscount: 120,
      expiry: new Date("2027-01-01"),
      isActive: true
    },
    {
      code: "PIZZA10",
      discountPercent: 10,
      minOrderValue: 199,
      maxDiscount: 80,
      expiry: new Date("2027-01-01"),
      isActive: true
    }
  ]);

  await Offer.insertMany([
    {
      title: "Weekend Family Feast",
      description: "Flat 25% on orders above INR 799",
      discount: 25,
      validFrom: new Date("2026-01-01"),
      validTill: new Date("2027-01-01"),
      isActive: true
    }
  ]);

  console.log("Seed completed");
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
