// middleware/auth.js
import jwt from "jsonwebtoken";

// E-mails autorizados como admin (além de quem tiver role === 'admin' no token)
const ADMIN_EMAILS = ["admin@suazo.com", "admin@hiago.com"];

// Lê o Bearer token, valida e coloca o payload em req.user
export const verifyToken = (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const [scheme, token] = auth.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Falta JWT_SECRET no ambiente" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // idealmente decoded tem { id, email, role } — ajuste seu login se necessário
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

// Permite apenas admin (role === 'admin') OU e-mails na allowlist
export const requireAdmin = (req, res, next) => {
  try {
    const role =
      req.user?.role ?? req.user?.user?.role ?? req.user?.claims?.role ?? "";
    const email =
      (req.user?.email ?? req.user?.user?.email ?? req.user?.claims?.email ?? "")
        .toString()
        .toLowerCase();

    if (role === "admin" || ADMIN_EMAILS.includes(email)) {
      return next();
    }
    return res.status(403).json({ error: "Acesso negado: apenas admin" });
  } catch {
    return res.status(403).json({ error: "Acesso negado: apenas admin" });
  }
};

// Opcional: rota de debug para inspecionar o token decodificado
export const whoAmIHandler = (req, res) => {
  return res.json({ user: req.user || null });
};
