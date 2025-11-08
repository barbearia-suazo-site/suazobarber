// server/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

/* ================================
   📁 __dirname en ESM
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================================
   🚀 App
================================ */
const app = express();

// Recomendado en Render/Proxies
app.set("trust proxy", 1);

/* ================================
   🧩 Middlewares
================================ */
const allowlist = [
  process.env.CLIENT_ORIGIN,                    // p.ej. https://suazobarber.vercel.app
  process.env.RENDER_EXTERNAL_URL,              // p.ej. https://suazobarber.onrender.com
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Permite llamadas desde tools, curl o SSR sin origin
      if (!origin) return cb(null, true);
      if (allowlist.some((o) => origin.startsWith(o))) return cb(null, true);
      return cb(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));

/* ================================
   📂 Archivos estáticos (uploads)
   ⚠️ En Render, el disco es efímero:
   se borra en cada deploy/restart.
================================ */
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));
console.log(`📸 Sirviendo uploads desde: ${uploadsPath}`);

/* ================================
   🔗 Rutas
================================ */
import authRoutes from "./auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import salesRoutes from "./routes/sales.routes.js";

// Prefijos de API
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/sales", salesRoutes);

/* ================================
   🧪 Health Check
================================ */
app.get("/", (_req, res) => {
  res.send("✅ Servidor y API funcionando correctamente!");
});

/* ================================
   404 y Handler de errores
================================ */
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((err, _req, res, _next) => {
  console.error("❌ Error:", err?.message || err);
  res.status(500).json({ error: "Error interno del servidor" });
});

/* ================================
   🧠 MongoDB
================================ */
mongoose.set("strictQuery", true);

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/barbearia";

mongoose
  .connect(MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log("✅ Conexión a MongoDB establecida correctamente")
  )
  .catch((err) =>
    console.error("❌ Error al conectar con MongoDB:", err?.message || err)
  );

/* ================================
   🚀 Arranque
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
  console.log(`🌍 Base URL: http://localhost:${PORT}`);
  console.log(`🖼️ Imágenes: http://localhost:${PORT}/uploads/<nombre-de-archivo>`);
});
