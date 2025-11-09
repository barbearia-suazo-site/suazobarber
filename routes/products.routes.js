// routes/products.routes.js
import express from "express";
import { verifyToken, requireAdmin } from "./auth.routes.js";
import Product from "../models/Product.js";

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

/* =======================
   Config de upload local (opcional)
======================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: uploadsPath,
  filename: (_req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

/* =====================================
   ➕ Criar produto (apenas admin)
   - Aceita:
     a) multipart/form-data com campo "file" (imagem) + campos texto
     b) JSON com "imageUrl" já pronto
===================================== */
router.post("/", verifyToken, requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const { name, price, description, imageUrl } = req.body;

    // decide a imagem: upload local OU url já enviada
    const finalImageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : (imageUrl || "");

    const payload = {
      name,
      price,
      description,
      imageUrl: finalImageUrl,
    };

    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Erro ao criar produto:", err);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

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
   - Aceita trocar imagem (file) ou só campos
===================================== */
router.put("/:id", verifyToken, requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const { name, price, description, imageUrl } = req.body;

    const update = { name, price, description };

    if (req.file) {
      update.imageUrl = `/uploads/${req.file.filename}`;
    } else if (imageUrl) {
      update.imageUrl = imageUrl;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    console.error("❌ Erro ao atualizar produto:", err);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

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
