require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    const emailAntigo = 'admin@barbearia.com'; // Email atual
    const novoEmail = 'admin@suazo.com'; // Novo email desejado
    const novaSenha = 'qZwd1JZLhT'; // Nova senha desejada

    const user = await User.findOne({ email: emailAntigo });
    if (!user) {
      console.log('❌ Usuário não encontrado.');
      return;
    }

    user.email = novoEmail;
    user.password = await bcrypt.hash(novaSenha, 10);

    await user.save();
    console.log('✅ Admin atualizado com sucesso!');
    console.log(`Novo login -> Email: ${novoEmail} | Senha: ${novaSenha}`);
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

updateAdmin();
