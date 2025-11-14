// models/Appointment.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  date: { type: Date, required: true },
  durationMinutes: { type: Number, default: 30 },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  },
  createdAt: { type: Date, default: Date.now },
});

const Appointment =
  mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);

export default Appointment;
