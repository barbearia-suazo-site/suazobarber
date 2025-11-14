// server/routes/bookings.routes.js
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
 * - tenta registrar uma Sale com o valor do serviço
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      service,      // nome do serviço (ex.: "Corte Simples")
      serviceId,    // opcional: id do serviço
      date,
      duration,
      price,        // opcional: preço enviado pelo front
      total,        // opcional: total enviado pelo front
    } = req.body;

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
    });

    // 2) Determinar o valor da venda
    let finalTotal = null;

    // a) se veio "total" no body
    if (typeof total === "number") {
      finalTotal = total;
    }
    // b) se veio "price" no body
    else if (typeof price === "number") {
      finalTotal = price;
    } else {
      // c) tentar buscar por ID do serviço
      let serviceDoc = null;

      if (serviceId) {
        serviceDoc = await Service.findById(serviceId);
      }

      // d) se não tem ID ou não achou, tenta pelo nome
      if (!serviceDoc && service) {
        serviceDoc = await Service.findOne({ name: service });
      }

      if (serviceDoc && typeof serviceDoc.price === "number") {
        finalTotal = serviceDoc.price;
      }
    }

    let sale = null;

    if (finalTotal != null && !Number.isNaN(Number(finalTotal))) {
      sale = await Sale.create({
        total: Number(finalTotal),
      });
    }

    console.log("📅 Nova reserva criada:", {
      name,
      email,
      service,
      startTime,
      endTime,
      finalTotal,
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
