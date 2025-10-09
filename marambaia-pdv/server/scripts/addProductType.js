// scripts/addProductType.js
// Script para adicionar o campo productType aos produtos existentes

const mongoose = require('mongoose');
const config = require('../config');

// Carregar modelo Product
require('../models/Product');

// Conectar ao banco de dados
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Product = mongoose.model('Product');

async function addProductType() {
  try {
    console.log('🔄 Iniciando migração de produtos...\n');

    // Buscar todos os produtos
    const products = await Product.find({});
    console.log(`📦 Total de produtos encontrados: ${products.length}\n`);

    // Categorias que geralmente são bebidas
    const beverageKeywords = [
      'bebida', 'suco', 'refrigerante', 'cerveja', 'água', 'vinho',
      'drink', 'juice', 'beer', 'water', 'wine', 'café', 'coffee',
      'chá', 'tea', 'coquetel', 'cocktail', 'vodka', 'whisky',
      'caipirinha', 'drinks', 'bar'
    ];

    let foodCount = 0;
    let beverageCount = 0;
    let updatedCount = 0;

    for (const product of products) {
      // Se já tem productType, pular
      if (product.productType) {
        console.log(`⏭️  Produto "${product.name}" já tem productType: ${product.productType}`);
        continue;
      }

      // Determinar o tipo baseado no nome ou categoria
      let productType = 'food'; // Default

      const productNameLower = product.name.toLowerCase();
      const categoryName = product.category?.name?.toLowerCase() || '';

      // Verificar se é bebida baseado em palavras-chave
      const isBeverage = beverageKeywords.some(keyword =>
        productNameLower.includes(keyword) || categoryName.includes(keyword)
      );

      if (isBeverage) {
        productType = 'beverage';
        beverageCount++;
      } else {
        foodCount++;
      }

      // Atualizar produto
      product.productType = productType;
      await product.save();
      updatedCount++;

      console.log(`✅ "${product.name}" → ${productType}`);
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   🍔 Comida: ${foodCount} produtos`);
    console.log(`   🍹 Bebida: ${beverageCount} produtos`);
    console.log(`   ✨ Total atualizado: ${updatedCount} produtos\n`);

    console.log('⚠️  IMPORTANTE: Revise os produtos e ajuste manualmente se necessário!\n');
    console.log('   Use o painel administrativo para editar produtos individuais.\n');

    mongoose.connection.close();
    console.log('✅ Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Executar migração
addProductType();
