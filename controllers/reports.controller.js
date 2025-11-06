const Order = require('../models/Order');
const Appointment = require('../models/Appointment');
exports.balance = async (req, res) => {
  const { startDate, endDate, employeeId } = req.query;
  if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required (YYYY-MM-DD)' });
  const start = new Date(startDate); const end = new Date(endDate); end.setHours(23,59,59,999);
  const orderFilter = { createdAt: { $gte: start, $lte: end } };
  if (employeeId) orderFilter.employee = employeeId;
  const orders = await Order.find(orderFilter).lean();
  const totalSales = orders.reduce((s,o)=> s + (o.total || 0), 0);
  const appointFilter = { date: { $gte: start, $lte: end }, status: 'completed' };
  if (employeeId) appointFilter.employee = employeeId;
  const appointments = await Appointment.find(appointFilter).lean();
  const salesByEmployee = {};
  orders.forEach(o => {
    const id = (o.employee && o.employee.toString()) || 'unassigned';
    salesByEmployee[id] = (salesByEmployee[id] || 0) + (o.total || 0);
  });
  res.json({ totalSales, ordersCount: orders.length, appointmentsCount: appointments.length, salesByEmployee, ordersSample: orders.slice(0,50) });
};
