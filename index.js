// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { router: authRoutes } = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const serviceRoutes = require('./routes/services.routes');
const reportRoutes = require('./routes/reports.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reports', reportRoutes);

// Teste
app.get('/', (req, res) => {
  res.send('✅ Servidor y API funcionando correctamente');
});

// Conexão MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ Error en MongoDB:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en el puerto ${PORT}`));
  