import express from "express";
import Employee from "../models/Employee.js";

const router = express.Router();

// 📋 Obtener todos los empleados
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

// ➕ Crear nuevo empleado
router.post("/", async (req, res) => {
  try {
    const { name, email, role, commissionPercent } = req.body;
    const newEmployee = new Employee({
      name,
      email,
      role,
      commissionPercent,
    });
    await newEmployee.save();
    res.json(newEmployee);
  } catch (err) {
    res.status(500).json({ error: "Error al crear empleado" });
  }
});

// ✏️ Editar empleado
router.put("/:id", async (req, res) => {
  try {
    const { name, email, role, commissionPercent } = req.body;
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { name, email, role, commissionPercent },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar empleado" });
  }
});

// 🗑️ Eliminar empleado
router.delete("/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Empleado eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar empleado" });
  }
});

export default router;
