// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =======================
   CORS (múltiplas origens)
   Use a env CLIENT_ORIGIN com CSV:
   ex.: https://seu-front.vercel.app,https://www.seudominio.com
======================= */
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
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/postman/health checks
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS bloqueado para origem: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// Pré-flight explícito (útil pra uploads em alguns navegadores)
app.options("*", cors());

/* =======================
   Parsers
   (multipart é tratado pelo multer nas rotas de upload)
======================= */
app.use(express.json({ limit: "10mb" }));

/* =======================
   Arquivos estáticos (opcional)
   Mantemos /uploads para compatibilidade (mesmo que Cloudinary seja usado)
======================= */
const uploadsPath = path.join(__dirname, "uploads");
try {
  fs.mkdirSync(uploadsPath, { recursive: true });
} catch {}
app.use("/uploads", express.static(uploadsPath));

/* =======================
   Rotas
======================= */
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

// Monte primeiro o /api/upload (caso exista algum middleware global de auth no futuro)
app.use("/api/upload", uploadRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/reports", reportsRoutes);

/* =======================
   Health
======================= */
app.get("/", (_req, res) => res.send("✅ API funcionando"));
app.get("/health", (_req, res) => res.json({ ok: true }));

/* =======================
   MongoDB
======================= */
mongoose.set("strictQuery", true);

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/barbearia";

mongoose
  .connect(mongoUri, { dbName: "barbearia" })
  .then(() => console.log("✅ Mongo conectado:", mongoose.connection.name))
  .catch((err) => {
    console.error("❌ Erro Mongo:", err?.message || err);
    process.exit(1);
  });

/* =======================
   Error handler amigável (inclui erros de CORS)
======================= */
app.use((err, _req, res, _next) => {
  if (err?.message?.startsWith("CORS bloqueado")) {
    return res.status(403).json({ error: err.message, allowedOrigins });
  }
  console.error("❌ Erro não tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

/* =======================
   Start
======================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server na porta ${PORT}`);
  console.log("✅ CORS permitido para:", allowedOrigins);
  console.log("🔧 Variáveis Cloudinary presentes?:", {
    CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
  });
});
