const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  items: [{ productId: String, name: String, price: Number, qty: Number }],
  total: { type: Number, default: 0 },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('Order', OrderSchema);
