// server/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

/* =====================================
   🧭 ESM: resolver __dirname corretamente
===================================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =====================================
   🚀 Inicializar app
===================================== */
const app = express();

/* =====================================
   🔐 CORS (suporta múltiplas origens)
   - defina CLIENT_ORIGIN com 1 ou + URLs separadas por vírgula
     ex: https://suazobarber.onrender.com,https://suazobarber.vercel.app
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
      // permitir requests de ferramentas (ex: curl/postman) sem origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS bloqueado para origem: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// tratar preflight
app.options("*", cors());

/* =====================================
   🧩 Middlewares principais
===================================== */
app.use(express.json({ limit: "10mb" }));

/* =====================================
   📂 Servir arquivos estáticos de uploads
   ⚠️ Em Render o disco é efêmero — prefira Cloudinary futuramente.
===================================== */
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));
console.log(`📸 Pasta de uploads servida em: ${uploadsPath}`);

/* =====================================
   🔗 Importar rotas
   (garanta que esses arquivos existem)
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
  res.send("✅ Servidor y API funcionando correctamente!");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

/* =====================================
   ⚠️ 404 - Rota não encontrada
===================================== */
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

/* =====================================
   🧠 Conexão com MongoDB
===================================== */
mongoose.set("strictQuery", true);

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/barbearia";
mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Conexión a MongoDB establecida correctamente"))
  .catch((err) =>
    console.error("❌ Error al conectar con MongoDB:", err?.message || err)
  );

/* =====================================
   🚀 Iniciar servidor
===================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
  console.log(`🌍 API base: http://localhost:${PORT}`);
  console.log(`🖼️ Imágenes: http://localhost:${PORT}/uploads/<archivo>`);
  if (allowedOrigins.length) {
    console.log("✅ CORS permitido para:", allowedOrigins.join(", "));
  }
});
