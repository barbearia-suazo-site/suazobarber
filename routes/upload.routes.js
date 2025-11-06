const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configuração do destino e nome do arquivo
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // nome único
  }
});

const upload = multer({ storage });

// Endpoint para upload de imagem
router.post('/', upload.single('image'), (req, res) => {
  try {
    res.json({
      message: 'Imagem enviada com sucesso!',
      filePath: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
  }
});

module.exports = router;
