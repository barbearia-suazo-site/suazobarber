// routes/upload.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// salva os arquivos em ./uploads (mesma raiz do server.js)
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (_req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});

const upload = multer({ storage });

// POST /api/upload  (campo: "file")
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Arquivo obrigatório" });
  res.json({ ok: true, url: `/uploads/${req.file.filename}` });
});

export default router; // 🔴 ESSENCIAL: exporta default
