const Appointment = require('../models/Appointment');

exports.list = async (req, res) => {
  const { startDate, endDate, employeeId } = req.query;
  const filter = {};
  if (startDate && endDate){
    const s = new Date(startDate); const e = new Date(endDate); e.setHours(23,59,59,999);
    filter.date = { $gte: s, $lte: e };
  }
  if (employeeId) filter.employee = employeeId;
  res.json(await Appointment.find(filter).populate('employee').lean());
};

exports.create = async (req, res) => {
  const ap = await Appointment.create(req.body);
  res.json(ap);
};

exports.update = async (req, res) => {
  const ap = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(ap);
};

exports.remove = async (req, res) => {
  await Appointment.findByIdAndDelete(req.params.id);
  res.json({ ok:true });
};
