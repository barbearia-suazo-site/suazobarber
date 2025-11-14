import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memória, 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/upload  (campo do arquivo: "file")
router.post("/", upload.single("file"), async (req, res) => {
  try {
    // LOGS ÚTEIS (aparecem no Render)
    console.log("[UPLOAD] env?", {
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasKey: !!process.env.CLOUDINARY_API_KEY,
      hasSecret: !!process.env.CLOUDINARY_API_SECRET,
    });
    console.log("[UPLOAD] file?", req.file && {
      size: req.file.size,
      mimetype: req.file.mimetype,
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
    });

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo obrigatório (campo 'file')" });
    }
    if (!req.file.mimetype?.startsWith("image/")) {
      return res.status(400).json({ error: "Tipo de arquivo inválido (envie imagem)" });
    }

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(base64, {
      folder: "productos",
      resource_type: "image",
    });

    return res.json({ ok: true, url: result.secure_url });
  } catch (err) {
    console.error("❌ Erro ao subir imagem:", err?.response || err);
    // Tenta expor mensagem do Cloudinary se houver
    const message =
      err?.response?.error?.message ||
      err?.message ||
      "Erro ao subir imagem";
    return res.status(500).json({ error: message });
  }
});

export default router;
