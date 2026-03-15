import mongoose from "mongoose";

const orderArchiveSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    archiveDate: { type: Date, required: true, index: true },
    orderCount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    archivedOrders: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
        tokenNumber: { type: Number, default: null },
        customerName: { type: String, default: "Customer" },
        status: { type: String, default: "pending" },
        paymentMethod: { type: String, default: "cod" },
        paymentStatus: { type: String, default: "pending" },
        totalAmount: { type: Number, default: 0 },
        totalPrice: { type: Number, default: 0 },
        items: [
          {
            name: { type: String, default: "Item" },
            qty: { type: Number, default: 1 }
          }
        ],
        createdAt: { type: Date, required: true }
      }
    ],
    sourceOrderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const OrderArchive = mongoose.model("OrderArchive", orderArchiveSchema);

export default OrderArchive;