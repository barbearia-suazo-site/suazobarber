require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    const email = 'admin@barbearia.com';
    const novaSenha = '123456';
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    const user = await User.findOneAndUpdate(
      { email },
      { password: senhaHash },
      { new: true }
    );

    if (user) {
      console.log(`🔐 Senha do admin (${email}) foi redefinida com sucesso.`);
    } else {
      console.log('⚠️ Usuário admin não encontrado.');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erro:', error);
    mongoose.connection.close();
  }
}

resetPassword();
