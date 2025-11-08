// server/routes/products.routes.js
import express from "express";
import { verifyToken, requireAdmin } from "./auth.routes.js";
import Product from "../models/Product.js";

const router = express.Router();

/* =====================================
   ➕ Criar produto (apenas admin)
===================================== */
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const product = await Product.create(req.body);
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
===================================== */
router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
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
