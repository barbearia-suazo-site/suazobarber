// server/routes/auth.routes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* ===========================================================
   🔐 Configuración / Constantes
=========================================================== */
const ALLOWED_ADMINS = ["admin@suazo.com", "admin@hiago.com"];
const LOGIN_WINDOW_MIN = 15;     // minutos bloqueado tras agotar intentos
const MAX_LOGIN_ATTEMPTS = 3;    // intentos permitidos

// Memoria simple para bloqueo (reinicia al reiniciar servidor)
const attempts = new Map(); // key: email -> { count, blockedUntil }

/* ===========================================================
   🔐 Middlewares
=========================================================== */
export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Token requerido" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token inválido" });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    next();
  });
}

export function requireAdmin(req, res, next) {
  // Admin + dentro de la lista blanca de correos
  if (req.userRole !== "admin" || !ALLOWED_ADMINS.includes(req.userEmail)) {
    return res.status(403).json({
      message:
        "Acceso restringido. Esta sección es solo para administradores autorizados.",
    });
  }
  next();
}

/* ===========================================================
   ✅ Verificar token (para painel admin)
=========================================================== */
router.get("/verify", verifyToken, (req, res) => {
  try {
    res.json({
      valid: true,
      role: req.userRole,
      email: req.userEmail,
      isAdminAllowed:
        req.userRole === "admin" && ALLOWED_ADMINS.includes(req.userEmail),
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: "Error al verificar token" });
  }
});

/* ===========================================================
   🧍 Registro (solo admins autorizados)
=========================================================== */
router.post("/register", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email y contraseña son requeridos" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name || "Nuevo usuario",
      email,
      password: hashed,
      role: role || "barber", // por defecto barbero
    });

    await newUser.save();
    res.status(201).json({ message: "✅ Usuario creado correctamente" });
  } catch (err) {
    console.error("❌ Error al registrar usuario:", err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

/* ===========================================================
   🔑 Login con bloqueo tras 3 intentos fallidos (15 min)
=========================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const isAdminAllowed = ALLOWED_ADMINS.includes(email);

    // 🔒 Verifica bloqueo (excepto para admins autorizados)
    const record = attempts.get(email);
    const now = Date.now();
    if (!isAdminAllowed && record?.blockedUntil && now < record.blockedUntil) {
      const msLeft = record.blockedUntil - now;
      const minLeft = Math.ceil(msLeft / 60000);
      return res.status(429).json({
        message:
          "Demasiados intentos fallidos. Tu acceso ha sido bloqueado temporalmente.",
        blocked: true,
        minutesLeft: minLeft,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      if (!isAdminAllowed) updateAttempts(email, false);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      if (!isAdminAllowed) {
        const { blocked } = updateAttempts(email, false);
        if (blocked) {
          return res.status(429).json({
            message:
              "Has superado el número de intentos. Acceso bloqueado por 15 minutos.",
            blocked: true,
            minutesLeft: LOGIN_WINDOW_MIN,
          });
        }
      }
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Éxito: resetea contador
    updateAttempts(email, true);

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      isAdminAllowed:
        user.role === "admin" && ALLOWED_ADMINS.includes(user.email),
    });
  } catch (err) {
    console.error("❌ Error al iniciar sesión:", err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

/* ===========================================================
   🧩 Utils: control de intentos
=========================================================== */
function updateAttempts(email, success) {
  let rec = attempts.get(email) || { count: 0, blockedUntil: null };
  if (success) {
    attempts.set(email, { count: 0, blockedUntil: null });
    return { blocked: false };
  }
  rec.count += 1;
  if (rec.count >= MAX_LOGIN_ATTEMPTS) {
    rec.blockedUntil = Date.now() + LOGIN_WINDOW_MIN * 60 * 1000;
    rec.count = 0; // reinicia conteo tras bloquear
    attempts.set(email, rec);
    return { blocked: true };
  }
  attempts.set(email, rec);
  return { blocked: false };
}

/* ===========================================================
   🔄 Reset manual de bloqueos (debug)
=========================================================== */
router.post("/reset-attempts", (req, res) => {
  attempts.clear();
  res.json({ message: "Intentos reiniciados." });
});

/* ===========================================================
   🔄 Reset manual de bloqueios (debug) — aceita GET e POST
   Uso: abrir no navegador -> http://localhost:5000/api/auth/reset-attempts
=========================================================== */
router.get("/reset-attempts", (req, res) => {
  attempts.clear();
  console.log("🔓 Bloqueios resetados via GET /reset-attempts");
  res.json({ message: "Intentos reiniciados (GET)." });
});

router.post("/reset-attempts", (req, res) => {
  attempts.clear();
  console.log("🔓 Bloqueios resetados via POST /reset-attempts");
  res.json({ message: "Intentos reiniciados (POST)." });
});

export default router;
