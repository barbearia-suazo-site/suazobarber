import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import Product from "../models/Product.js";
import { verifyToken, requireAdmin } from "./auth.routes.js";

const router = express.Router();

/* =========================
   📂 Configuração da pasta uploads
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* =========================
   📷 Multer - Upload de Imagens
========================= */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/\s+/g, "_");
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(safeOriginal)}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpe?g|png|webp|gif)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error("Tipo de arquivo não permitido. Apenas imagens."));
  },
});

/* =========================
   📦 Listar produtos (público)
========================= */
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("❌ Erro ao obter produtos:", err);
    res.status(500).json({ error: "Erro ao obter os produtos" });
  }
});

/* =========================
   🔍 Obter produto por ID
========================= */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });
    res.json(product);
  } catch (err) {
    console.error("❌ Erro ao obter produto:", err);
    res.status(500).json({ error: "Erro ao obter o produto" });
  }
});

/* =========================
   ➕ Criar produto (admin)
========================= */
router.post("/", verifyToken, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: "Nome e preço são obrigatórios." });
    }

    // salva apenas o nome do arquivo
    const image = req.file ? req.file.filename : null;

    const product = new Product({
      name,
      price,
      description: description || "",
      image,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Erro ao criar produto:", err);
    res.status(500).json({ error: "Erro ao criar produto." });
  }
});

/* =========================
   ✏️ Editar produto (admin)
========================= */
router.put("/:id", verifyToken, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const update = {};

    if (name !== undefined) update.name = name;
    if (price !== undefined) update.price = price;
    if (description !== undefined) update.description = description;
    if (req.file) update.image = req.file.filename;

    const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ error: "Produto não encontrado" });

    res.json(updated);
  } catch (err) {
    console.error("❌ Erro ao atualizar produto:", err);
    res.status(500).json({ error: "Erro ao atualizar produto." });
  }
});

/* =========================
   🗑️ Deletar produto (admin)
========================= */
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Produto não encontrado" });

    // Opcional: remover o arquivo da pasta uploads
    // if (deleted.image) {
    //   const filePath = path.join(uploadDir, deleted.image);
    //   fs.unlink(filePath, () => {});
    // }

    res.json({ message: "Produto removido com sucesso." });
  } catch (err) {
    console.error("❌ Erro ao deletar produto:", err);
    res.status(500).json({ error: "Erro ao deletar produto." });
  }
});

export default router;
