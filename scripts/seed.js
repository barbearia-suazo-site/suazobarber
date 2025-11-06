import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js"; // ✅ Certifique-se que este modelo existe e exporta email, password, role, etc.

dotenv.config();

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/barbearia";

async function run() {
  try {
    await mongoose.connect(MONGO);
    console.log("✅ Conectado ao MongoDB");

    // Limpa usuários antigos duplicados
    await User.deleteMany({});

    // Lista de administradores a criar
    const admins = [
      { email: "admin@suazo.com", password: "jpDfkVu" },
      { email: "admin@hiago.com", password: "jpDfkVuQDX07weiv" },
      { email: "barber@arlin.com", password: "DX07weiv" },
    ];

    for (const adm of admins) {
      const exists = await User.findOne({ email: adm.email });
      if (exists) {
        console.log(`⚠️  ${adm.email} já existe, ignorado.`);
        continue;
      }

      const hashed = await bcrypt.hash(adm.password, 10);
      await User.create({
        name: adm.email.split("@")[0],
        email: adm.email,
        password: hashed,
        role: "admin",
      });

      console.log(`✅ Criado: ${adm.email} (senha: ${adm.password})`);
    }

    console.log("🌱 Seed finalizado com sucesso!");
  } catch (err) {
    console.error("❌ Erro no seed:", err);
  } finally {
    process.exit(0);
  }
}

run();
