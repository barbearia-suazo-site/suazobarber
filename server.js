// server/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// ✅ ESM: resolver __dirname corretamente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🚀 Inicializar app
const app = express();

// 🧩 Middlewares principais
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));

/* =====================================
   📂 Servir arquivos estáticos de uploads
===================================== */
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));
console.log(`📸 Pasta de uploads servida em: ${uploadsPath}`);

/* =====================================
   🔗 Importar rotas
===================================== */
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import salesRoutes from "./routes/sales.routes.js";

/* =====================================
   🧭 Prefixos da API
===================================== */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/sales", salesRoutes);

/* =====================================
   🧪 Health-check
===================================== */
app.get("/", (_req, res) => {
  res.send("✅ Servidor e API funcionando corretamente!");
});

/* =====================================
   ⚠️ Rota não encontrada
===================================== */
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

/* =====================================
   🧠 Conexão com MongoDB
===================================== */
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/barbearia", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Conexão com MongoDB estabelecida com sucesso"))
  .catch((err) =>
    console.error("❌ Erro ao conectar com MongoDB:", err?.message || err)
  );

/* =====================================
   🚀 Iniciar servidor
===================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escutando na porta ${PORT}`);
  console.log(`🌍 API: http://localhost:${PORT}`);
  console.log(`🖼️ Imagens: http://localhost:${PORT}/uploads/<nome-da-imagem>`);
});
