// server/routes/auth.routes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* ===========================================================
   🔐 Configuração / Constantes
=========================================================== */
const ALLOWED_ADMINS = ["admin@suazo.com", "admin@hiago.com"];
const ADMIN_ALLOWLIST = ALLOWED_ADMINS.map(e => e.toLowerCase());
const LOGIN_WINDOW_MIN = 15;     // minutos bloqueado após 3 tentativas
const MAX_LOGIN_ATTEMPTS = 3;    // tentativas permitidas

// Memória simples para bloqueio (reinicia ao reiniciar servidor)
const attempts = new Map(); // key: email -> { count, blockedUntil }

/* ===========================================================
   🔐 Middlewares
=========================================================== */
export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = (decoded.email || "").toLowerCase();
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

export function requireAdmin(req, res, next) {
  // Admin + dentro da allowlist
  if (req.userRole !== "admin" || !ADMIN_ALLOWLIST.includes(req.userEmail)) {
    return res.status(403).json({
      message:
        "Acceso restringido. Esta sección es solo para administradores autorizados.",
    });
  }
  return next();
}

/* ===========================================================
   ✅ Verificar token (para painel admin)
=========================================================== */
router.get("/verify", verifyToken, (req, res) => {
  try {
    const isAdminAllowed =
      req.userRole === "admin" && ADMIN_ALLOWLIST.includes(req.userEmail);
    res.json({
      valid: true,
      role: req.userRole,
      email: req.userEmail,
      isAdminAllowed,
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: "Error al verificar token" });
  }
});

/* ===========================================================
   🧍 Registro (somente admins autorizados)
=========================================================== */
router.post("/register", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email y contraseña son requeridos" });
    }

    const emailNorm = String(email).toLowerCase();
    const exists = await User.findOne({ email: emailNorm });
    if (exists) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name || "Nuevo usuario",
      email: emailNorm,           // ✅ salva normalizado
      password: hashed,
      role: role || "barber",     // por defecto barbero
    });

    await newUser.save();
    return res.status(201).json({ message: "✅ Usuario creado correctamente" });
  } catch (err) {
    console.error("❌ Error al registrar usuario:", err);
    return res.status(500).json({ error: "Error al registrar usuario" });
  }
});

/* ===========================================================
   🔑 Login com bloqueio após 3 tentativas (15 min)
=========================================================== */
router.post("/login", async (req, res) => {
  try {
    const emailNorm = String(req.body.email || "").toLowerCase();
    const { password } = req.body;
    const isAdminAllowed = ADMIN_ALLOWLIST.includes(emailNorm);

    // 🔒 Verifica bloqueio (exceto para admins autorizados)
    const record = attempts.get(emailNorm);
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

    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      if (!isAdminAllowed) updateAttempts(emailNorm, false);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password || "", user.password || "");
    if (!isMatch) {
      if (!isAdminAllowed) {
        const { blocked } = updateAttempts(emailNorm, false);
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

    // Sucesso: reseta contador
    updateAttempts(emailNorm, true);

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email.toLowerCase(),
        role: user.role,
      },
      isAdminAllowed: user.role === "admin" && ADMIN_ALLOWLIST.includes(user.email.toLowerCase()),
    });
  } catch (err) {
    console.error("❌ Error al iniciar sesión:", err);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

/* ===========================================================
   🧩 Utils: controle de tentativas
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
    rec.count = 0; // reinicia contagem após bloquear
    attempts.set(email, rec);
    return { blocked: true };
  }
  attempts.set(email, rec);
  return { blocked: false };
}

/* ===========================================================
   🔄 Reset manual de bloqueios (debug) — GET e POST
   Uso: abrir no navegador -> /api/auth/reset-attempts
=========================================================== */
router.get("/reset-attempts", (_req, res) => {
  attempts.clear();
  console.log("🔓 Bloqueios resetados via GET /reset-attempts");
  return res.json({ message: "Intentos reiniciados (GET)." });
});

router.post("/reset-attempts", (_req, res) => {
  attempts.clear();
  console.log("🔓 Bloqueios resetados via POST /reset-attempts");
  return res.json({ message: "Intentos reiniciados (POST)." });
});

export default router;
