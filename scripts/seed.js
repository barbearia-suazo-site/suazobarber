// server/scripts/seed.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

/* ---------------------------------------
 ✅ DEFINE O NOME DO BANCO
----------------------------------------- */
const DB_NAME = "barbearia";

/* ---------------------------------------
 ✅ CONEXÃO COM MONGO (usa o DB certo)
----------------------------------------- */
const MONGO =
  process.env.MONGO_URI ||
  `mongodb://localhost:27017/${DB_NAME}`;

async function run() {
  try {
    await mongoose.connect(MONGO, {
      dbName: DB_NAME, // <- força o banco correto
    });

    console.log("✅ Conectado ao MongoDB:", mongoose.connection.name);

    // ✅ NÃO LIMPA MAIS A COLEÇÃO TODA (seguro para produção)
    // await User.deleteMany({});  // ❌ REMOVIDO

    /* ---------------------------------------
     ✅ Admins permitidos
    ----------------------------------------- */
    const admins = [
      { email: "admin@suazo.com", password: "jpDfkVu" },
      { email: "admin@hiago.com", password: "jpDfkVuQDX07weiv" },
    ];

    for (const adm of admins) {
      const exists = await User.findOne({ email: adm.email });

      if (exists) {
        console.log(`⚠️  ${adm.email} já existe. Ignorado.`);
        continue;
      }

      const hashed = await bcrypt.hash(adm.password, 10);

      await User.create({
        name: adm.email.split("@")[0],
        email: adm.email,
        password: hashed,
        role: "admin",
      });

      console.log(`✅ Criado admin: ${adm.email} (senha: ${adm.password})`);
    }

    console.log("🌱 Seed finalizado com sucesso!");
  } catch (err) {
    console.error("❌ Erro no seed:", err);
  } finally {
    process.exit(0);
  }
}

run();
