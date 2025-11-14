// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  items: [
    {
      productId: String,
      name: String,
      price: Number,
      qty: Number,
    },
  ],
  total: { type: Number, default: 0 },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "pending" },
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
