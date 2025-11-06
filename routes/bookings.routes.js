import express from "express";

const router = express.Router();

/**
 * 📅 Criar reserva (simulada)
 * Aqui futuramente podemos integrar com Google Calendar ou salvar no MongoDB.
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, service, date, duration } = req.body;

    if (!name || !email || !service || !date || !duration) {
      return res.status(400).json({ error: "❌ Faltan datos en la solicitud." });
    }

    // Simula criação da reserva no servidor
    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    console.log("📅 Nova reserva criada:");
    console.log({ name, email, service, startTime, endTime });

    // Resposta simulada
    res.status(200).json({
      message: "✅ Reserva creada correctamente (modo local).",
      booking: { name, email, service, startTime, endTime },
    });
  } catch (err) {
    console.error("❌ Erro ao criar reserva:", err);
    res.status(500).json({ error: "Error interno do servidor." });
  }
});

export default router;
