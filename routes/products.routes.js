// routes/products.routes.js
import express from "express";
import Product from "../models/Product.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/* =====================================
   ➕ Crear producto (solo admin)
   - Espera JSON:
     { name, price, description, imageUrl }
   - En la base de datos se guarda en el campo "image"
===================================== */
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, price, description, imageUrl, image } = req.body;

    if (!name || price == null) {
      return res
        .status(400)
        .json({ error: "Nombre y precio son obligatorios." });
    }

    // Cloudinary viene como imageUrl; por compatibilidad también aceptamos "image"
    const finalImage = imageUrl || image || "";

    const payload = {
      name,
      price,
      description: description || "",
      image: finalImage, // 👈 este es el campo que se guarda en Mongo
    };

    const product = await Product.create(payload);
    return res.status(201).json(product);
  } catch (err) {
    console.error("❌ Error al crear producto:", err);
    return res.status(500).json({ error: "Error al crear producto" });
  }
});

/* =====================================
   📋 Listar todos los productos
===================================== */
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    console.error("❌ Error al listar productos:", err);
    return res.status(500).json({ error: "Error al obtener productos" });
  }
});

/* =====================================
   🔍 Obtener un producto por ID
===================================== */
router.get("/:id", async (req, res) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    return res.json(item);
  } catch (err) {
    console.error("❌ Error al buscar producto:", err);
    return res.status(500).json({ error: "Error al buscar producto" });
  }
});

/* =====================================
   ✏️ Actualizar producto (solo admin)
   - También solo JSON:
     { name, price, description, imageUrl }
   - Se sigue guardando en el campo "image"
===================================== */
router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, price, description, imageUrl, image } = req.body;

    const update = {};
    if (name != null) update.name = name;
    if (price != null) update.price = price;
    if (description != null) update.description = description;

    const finalImage = imageUrl || image;
    if (finalImage != null) {
      update.image = finalImage;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    return res.json(updated);
  } catch (err) {
    console.error("❌ Error al actualizar producto:", err);
    return res.status(500).json({ error: "Error al actualizar producto" });
  }
});

/* =====================================
   🗑️ Eliminar producto (solo admin)
===================================== */
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    return res.json({ message: "Producto eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    return res.status(500).json({ error: "Error al eliminar producto" });
  }
});

export default router;
