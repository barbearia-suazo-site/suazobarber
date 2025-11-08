// server/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Resolver __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =====================================
   ✅ CORS com múltiplas origens
===================================== */
const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const defaultOrigins = ["http://localhost:3000"];
const envOrigins = parseOrigins(process.env.CLIENT_ORIGIN);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS bloqueado para origem: ${origin}`), false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

/* =====================================
   ✅ Servir uploads
===================================== */
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));
console.log(`📸 Pasta de uploads servida em: ${uploadsPath}`);

/* =====================================
   ✅ Rotas corretas
===================================== */
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import reportsRoutes from "./routes/reports.routes.js";

// ✅ Rota de upload corrigida para ESM
import uploadRoutes from "./routes/upload.routes.cjs";

/* =====================================
   ✅ Prefixos
===================================== */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/upload", uploadRoutes);

/* =====================================
   ✅ Health check
===================================== */
app.get("/", (_req, res) => res.send("✅ API funcionando"));
app.get("/health", (_req, res) => res.json({ ok: true }));

/* =====================================
   ✅ MongoDB Conexão correta
===================================== */
<<<<<<< HEAD
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/barbearia";

mongoose
  .connect(mongoUri, {
    dbName: "barbearia",          // <- garante que NÃO vai para 'test'
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Conectado ao MongoDB:", mongoose.connection.name))
  .catch((err) => console.error("❌ Erro Mongo:", err?.message || err));
=======
mongoose.set("strictQuery", true);

const mongoUri = process.env.MONGO_URI;

mongoose
  .connect(mongoUri, {
    dbName: "barbearia", // ✅ Não usa database test
  })
  .then(() =>
    console.log("✅ Conectado ao MongoDB:", mongoose.connection.name)
  )
  .catch((err) => console.error("❌ Erro Mongo:", err.message));
>>>>>>> e602766 (update server)

/* =====================================
   ✅ Start Server
===================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando porta ${PORT}`);
  console.log(`✅ CORS permitido para:`, allowedOrigins);
});
