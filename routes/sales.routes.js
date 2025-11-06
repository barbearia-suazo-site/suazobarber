import express from "express";
import mongoose from "mongoose";
import { verifyToken } from "./auth.routes.js"; // protege com login JWT

const router = express.Router();

// 🧾 Modelo de Venta
const Sale =
  mongoose.models.Sale ||
  mongoose.model(
    "Sale",
    new mongoose.Schema({
      total: { type: Number, required: true },
      createdAt: { type: Date, default: Date.now },
    })
  );


// ✅ Registrar nueva venta (solo admin)
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Solo el administrador puede registrar ventas" });
    }

    const { total } = req.body;
    if (!total) return res.status(400).json({ error: "Total requerido" });

    const sale = new Sale({ total });
    await sale.save();

    // Envia a nova venda + total atualizado
    const totalGeneral = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    res.json({
      message: "✅ Venta registrada correctamente",
      sale,
      totalGeneral: totalGeneral[0]?.total || 0,
    });
  } catch (err) {
    console.error("❌ Error al registrar venta:", err);
    res.status(500).json({ error: "Error al registrar venta" });
  }
});


// ❌ Eliminar venta (solo admin)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Solo el administrador puede eliminar ventas" });
    }

    await Sale.findByIdAndDelete(req.params.id);

    const totalGeneral = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    res.json({
      message: "🗑️ Venta eliminada correctamente",
      totalGeneral: totalGeneral[0]?.total || 0,
    });
  } catch (err) {
    console.error("❌ Error al eliminar venta:", err);
    res.status(500).json({ error: "Error al eliminar venta" });
  }
});


// 📊 Listar ventas (agrupadas por mes o por rango de fechas)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { start, end } = req.query;
    let matchStage = {};

    // Se foi passado intervalo de datas
    if (start && end) {
      matchStage = {
        createdAt: {
          $gte: new Date(start),
          $lte: new Date(end),
        },
      };
    }

    // Agrupa por mês/ano
    const sales = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalSales: { $sum: "$total" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Transforma os dados para { month: 'Jan 2025', totalSales: 123 }
    const formatted = sales.map((s) => ({
      month: new Date(s._id.year, s._id.month - 1).toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      totalSales: s.totalSales,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error al listar ventas:", err);
    res.status(500).json({ error: "Error al listar ventas" });
  }
});

export default router;
