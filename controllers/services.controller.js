const Service = require('../models/Service');
exports.list = async (req, res) => res.json(await Service.find().lean());
exports.create = async (req, res) => res.json(await Service.create(req.body));
exports.update = async (req, res) => res.json(await Service.findByIdAndUpdate(req.params.id, req.body, { new: true }));
exports.remove = async (req, res) => { await Service.findByIdAndDelete(req.params.id); res.json({ ok:true }); };
