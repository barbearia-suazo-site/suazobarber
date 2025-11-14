// middlewares/auth.js
import jwt from "jsonwebtoken";

/**
 * E-mails com permissão de admin, além de quem tiver role === 'admin' no token.
 * Ajuste se necessário.
 */
const ADMIN_EMAILS = ["admin@suazo.com", "admin@hiago.com"];

/**
 * Lê e valida o Bearer token do header Authorization.
 * Anexa o payload decodificado em req.user.
 */
export const verifyToken = (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const [scheme, token] = auth.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    if (!process.env.JWT_SECRET) {
      // Ajuda a diagnosticar ambiente mal configurado
      return res
        .status(500)
        .json({ error: "Config faltando: JWT_SECRET não definido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Esperado: decoded contenha pelo menos { id, email, role } — ajuste conforme seu login gera o token
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

/**
 * Exige privilégio de admin.
 * Aceita se:
 *  - req.user.role === 'admin', OU
 *  - req.user.email estiver na lista ADMIN_EMAILS
 */
export const requireAdmin = (req, res, next) => {
  try {
    const role =
      req.user?.role ?? req.user?.user?.role ?? req.user?.claims?.role
