const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  serviceName: String,
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  date: Date,
  durationMinutes: Number,
  status: { type: String, enum: ['scheduled','completed','cancelled'], default: 'scheduled' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
