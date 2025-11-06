require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    const admins = [
      { name: 'Administrador Hiago', email: 'admin@hiago.com', password: 'f94dejbt' },
      { name: 'Administrador Suazo', email: 'admin@suazo.com', password: 'qZwd1JZLhT' },
    ];

    for (const admin of admins) {
      const existing = await User.findOne({ email: admin.email });
      if (existing) {
        console.log(`⚠️ Usuário ${admin.email} já existe. Pulando...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 10);
      const newUser = new User({
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
      });

      await newUser.save();
      console.log(`✅ Criado: ${admin.email}`);
    }

    console.log('🎉 Todos os administradores foram processados.');
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Erro ao criar administradores:', err);
  }
}

createAdmins();
