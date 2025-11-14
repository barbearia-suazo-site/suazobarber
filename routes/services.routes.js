import express from "express";
import multer from "multer";
import Service from "../models/Service.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "server/uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// 💈 Listar serviços
router.get("/", async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener servicios" });
  }
});

// ➕ Criar serviço (admin)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const newService = new Service({ name, price, description, image });
    await newService.save();
    res.json(newService);
  } catch (err) {
    res.status(500).json({ error: "Error al crear servicio" });
  }
});

// ✏️ Editar
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { name, price, description } = req.body;
    await Service.findByIdAndUpdate(req.params.id, { name, price, description });
    res.json({ message: "Servicio actualizado" });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar servicio" });
  }
});

// 🗑️ Eliminar
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: "Servicio eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar servicio" });
  }
});

export default router;
