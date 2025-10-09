// scripts/runCleanup.js
// Script para executar limpeza de dados órfãos

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { runFullCleanup } = require('../utils/cleanupOrphanedData');

// Carregar modelos
require('../models/User');
require('../models/Category');
require('../models/Product');
require('../models/Table');
require('../models/Customer');
require('../models/OrderItem');
require('../models/Order');
require('../models/CashRegister');
require('../models/CashTransaction');

async function main() {
  try {
    // Conectar ao banco
    await connectDB();

    console.log('\n🔧 Executando limpeza de dados...\n');

    // Executar limpeza
    const results = await runFullCleanup();

    console.log('\n✅ Limpeza concluída com sucesso!');
    console.log('Você pode agora recarregar a página de analytics.');

    // Desconectar
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao executar limpeza:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

main();
