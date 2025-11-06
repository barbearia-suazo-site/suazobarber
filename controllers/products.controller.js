const Product = require('../models/Product');
exports.list = async (req, res) => {
  const products = await Product.find().lean();
  res.json(products);
};
exports.create = async (req, res) => {
  const p = await Product.create(req.body);
  res.json(p);
};
exports.update = async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(p);
};
exports.remove = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};
