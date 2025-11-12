// routes/products.routes.js
import express from "express";
import { verifyToken, requireAdmin } from "./auth.routes.js";
import Product from "../models/Product.js";

import multer from "multer";
// ⬇️ ADICIONE: Cloudinary (ou troque pelo seu storage)
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

/* =======================
   Cloudinary (env vars necessárias):
   CLOUDINARY_CLOUD_NAME
   CLOUDINARY_API_KEY
   CLOUDINARY_API_SECRET
======================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =======================
   Multer em memória (NÃO disco)
======================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* =====================================
   ➕ Criar produto (apenas admin)
   - Aceita:
     a) multipart/form-data com campo "file" ou "image"
     b) JSON com "imageUrl"
===================================== */
router.post(
  "/",
  verifyToken,
  requireAdmin,
  upload.fields([{ name: "file", maxCount: 1 }, { name: "image", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { name, price, description, imageUrl } = req.body;

      // 1) Se veio arquivo, sobe para Cloudinary
      let finalImageUrl = imageUrl || "";
      const fileFromForm =
        (req.files?.file?.[0]) ||
        (req.files?.image?.[0]) ||
        null;

      if (fileFromForm && fileFromForm.buffer && fileFromForm.mimetype) {
        // Converte buffer em base64 data URI
        const base64 = `data:${fileFromForm.mimetype};base64,${fileFromForm.buffer.toString("base64")}`;

        const up = await cloudinary.uploader.upload(base64, {
          folder: "productos", // opcional: pasta de destino
        });

        finalImageUrl = up.secure_url;
      }

      // 2) Monta payload
      const payload = {
        name,
        price,
        description,
        imageUrl: finalImageUrl, // pode ficar vazio se você permitir produto sem imagem
      };

      // 3) Salva no DB
      const product = await Product.create(payload);
      return res.status(201).json(product);
    } catch (err) {
      console.error("❌ Erro ao criar produto:", err);
      return res.status(500).json({ error: "Erro ao criar produto" });
    }
  }
);

/* =====================================
   📋 Listar todos
===================================== */
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("❌ Erro ao listar produtos:", err);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

/* =====================================
   🔍 Buscar 1
===================================== */
router.get("/:id", async (req, res) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Produto não encontrado" });
    res.json(item);
  } catch (err) {
    console.error("❌ Erro ao buscar produto:", err);
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

/* =====================================
   ✏️ Atualizar (apenas admin)
   - Aceita trocar imagem (file/image) ou só campos
===================================== */
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  upload.fields([{ name: "file", maxCount: 1 }, { name: "image", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { name, price, description, imageUrl } = req.body;
      const update = { name, price, description };

      const fileFromForm =
        (req.files?.file?.[0]) ||
        (req.files?.image?.[0]) ||
        null;

      if (fileFromForm && fileFromForm.buffer && fileFromForm.mimetype) {
        const base64 = `data:${fileFromForm.mimetype};base64,${fileFromForm.buffer.toString("base64")}`;
        const up = await cloudinary.uploader.upload(base64, { folder: "productos" });
        update.imageUrl = up.secure_url;
      } else if (imageUrl) {
        update.imageUrl = imageUrl;
      }

      const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
      res.json(updated);
    } catch (err) {
      console.error("❌ Erro ao atualizar produto:", err);
      res.status(500).json({ error: "Erro ao atualizar produto" });
    }
  }
);

/* =====================================
   🗑️ Remover (apenas admin)
===================================== */
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Produto removido" });
  } catch (err) {
    console.error("❌ Erro ao remover produto:", err);
    res.status(500).json({ error: "Erro ao remover produto" });
  }
});

export default router;
