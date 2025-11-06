import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// ✅ Usa modelo existente ou cria se ainda não existir
const Sale =
  mongoose.models.Sale ||
  mongoose.model(
    "Sale",
    new mongoose.Schema({
      total: { type: Number, required: true },
      createdAt: { type: Date, default: Date.now },
    })
  );

// 📊 Obtener ventas mensuales (para el gráfico del panel admin)
router.get("/sales", async (req, res) => {
  try {
    // 🔹 Si no hay ventas, devolver datos simulados para el panel
    const count = await Sale.countDocuments();
    if (count === 0) {
      console.warn("⚠️ No hay ventas en la base de datos. Enviando datos simulados...");
      const fakeData = [
        { _id: 1, totalSales: 120 },
        { _id: 2, totalSales: 200 },
        { _id: 3, totalSales: 180 },
        { _id: 4, totalSales: 250 },
        { _id: 5, totalSales: 300 },
        { _id: 6, totalSales: 150 },
        { _id: 7, totalSales: 0 },
        { _id: 8, totalSales: 220 },
        { _id: 9, totalSales: 260 },
        { _id: 10, totalSales: 310 },
        { _id: 11, totalSales: 280 },
        { _id: 12, totalSales: 400 },
      ];
      return res.json(fakeData);
    }

    // 🔹 Se houver vendas reais
    const sales = await Sale.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalSales: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(sales);
  } catch (err) {
    console.error("❌ Error al obtener ventas mensuales:", err);
    res.status(500).json({ error: "Error al obtener ventas mensuales" });
  }
});

// 📆 Obtener ventas por rango de fechas
router.get("/sales-range", async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "Faltan fechas de inicio o fin" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const sales = await Sale.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSales: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(sales);
  } catch (err) {
    console.error("❌ Error al obtener ventas por fechas:", err);
    res.status(500).json({ error: "Error al obtener ventas por fechas" });
  }
});

export default router;
