// routes/upload.routes.js
import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer em memória (não grava em disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/upload  (campo: "file")
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo obrigatório" });

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(base64, {
      folder: "productos", // opcional: pasta dentro do Cloudinary
    });

    res.json({ ok: true, url: result.secure_url });
  } catch (err) {
    console.error("❌ Erro ao subir imagem:", err);
    res.status(500).json({ error: "Erro ao subir imagem" });
  }
});

export default router;
