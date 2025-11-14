// routes/bookings.routes.js
import express from "express";
import mongoose from "mongoose";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";

const router = express.Router();

/**
 * Modelo Sale (mesmo shape de sales.routes.js)
 */
const Sale =
  mongoose.models.Sale ||
  mongoose.model(
    "Sale",
    new mongoose.Schema({
      total: { type: Number, required: true },
      createdAt: { type: Date, default: Date.now },
    })
  );

/**
 * 📅 Criar reserva REAL:
 * - valida dados
 * - grava Appointment no Mongo
 * - tenta encontrar o Service e registrar uma Sale com o preço
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, service, date, duration } = req.body;

    if (!name || !email || !service || !date || !duration) {
      return res
        .status(400)
        .json({ error: "❌ Faltan datos en la solicitud." });
    }

    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // 1) Criar Appointment no Mongo
    const appointment = await Appointment.create({
      serviceName: service,
      date: startTime,
      durationMinutes: duration,
      status: "scheduled",
      // employee pode ser null se não informado
    });

    // 2) Tentar encontrar o serviço para obter o preço
    const serviceDoc = await Service.findOne({ name: service });
    let sale = null;

    if (serviceDoc && typeof serviceDoc.price === "number") {
      sale = await Sale.create({
        total: serviceDoc.price,
      });
    }

    console.log("📅 Nova reserva criada:", {
      name,
      email,
      service,
      startTime,
      endTime,
      saleTotal: sale?.total,
    });

    return res.status(200).json({
      message: "✅ Reserva creada correctamente.",
      booking: {
        name,
        email,
        service,
        startTime,
        endTime,
        appointmentId: appointment._id,
      },
      sale: sale
        ? {
            id: sale._id,
            total: sale.total,
          }
        : null,
    });
  } catch (err) {
    console.error("❌ Erro ao criar reserva:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
