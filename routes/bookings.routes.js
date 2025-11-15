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
      service,   // nome do serviço (ex.: "Corte clásico (sin degradado)")
      serviceId, // opcional: id do serviço
      date,
      duration,
      price,     // pode vir como número ou string
      total,     // pode vir como número ou string
    } = req.body;

    if (!name || !email || !service || !date || !duration) {
      return res
        .status(400)
        .json({ error: "❌ Faltan datos en la solicitud." });
    }

    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + Number(duration) * 60000);

    // 1) Criar Appointment no Mongo
    const appointment = await Appointment.create({
      serviceName: service,
      date: startTime,
      durationMinutes: Number(duration),
      status: "scheduled",
    });

    // 2) Determinar o valor da venda (finalTotal)
    let finalTotal = null;

    // a) Tenta usar "total" (aceita número ou string tipo "15")
    const numTotal = Number(total);
    if (!Number.isNaN(numTotal) && numTotal > 0) {
      finalTotal = numTotal;
    } else {
      // b) Tenta usar "price" (aceita número ou string tipo "15")
      const numPrice = Number(price);
      if (!Number.isNaN(numPrice) && numPrice > 0) {
        finalTotal = numPrice;
      } else {
        // c) se não vier nada que preste do front, busca no banco pelo serviço
        let serviceDoc = null;

        // tenta por ID se foi enviado
        if (serviceId) {
          try {
            serviceDoc = await Service.findById(serviceId);
          } catch (e) {
            console.warn("⚠️ serviceId inválido:", serviceId);
          }
        }

        // se ainda não achou, tenta pelo nome do serviço
        if (!serviceDoc && service) {
          serviceDoc = await Service.findOne({ name: service });
        }

        if (serviceDoc && typeof serviceDoc.price === "number") {
          finalTotal = serviceDoc.price;
        }
      }
    }

    let sale = null;

    // 3) Se conseguimos achar um valor numérico, cria a venda
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
      hasSale: !!sale,
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
