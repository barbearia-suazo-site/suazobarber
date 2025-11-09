// server.js (na raiz do repo)
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =======================
   CORS (múltiplas origens)
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
      if (!origin) return cb(null, true); // curl/postman
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS bloqueado para origem: ${origin}`), false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

/* =======================
   Arquivos de upload
======================= */
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

/* =======================
   Rotas
======================= */
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import uploadRoutes from "./routes/upload.routes.js"; // << export default

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/upload", uploadRoutes);

/* =======================
   Health
======================= */
app.get("/", (_req, res) => res.send("✅ API funcionando"));
app.get("/health", (_req, res) => res.json({ ok: true }));

/* =======================
   MongoDB
======================= */
mongoose.set("strictQuery", true);

// Aceita MONGODB_URI (Vercel/Render) ou MONGO_URI (fallback) ou local
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
   Start
======================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server na porta ${PORT}`);
  console.log("✅ CORS permitido para:", allowedOrigins);
});
