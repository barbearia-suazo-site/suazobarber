// server/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// garante que a pasta uploads existe
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // salva em server/uploads
  },
  filename: function (req, file, cb) {
    // cria nome único: timestamp + extensão original
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// filtro simples para aceitar apenas imagens
function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error('Tipo de arquivo não permitido. Apenas imagens são aceitas.'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max (ajustável)
});

module.exports = upload;
