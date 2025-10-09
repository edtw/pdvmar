// scripts/fixProductTypes.js
// Corrigir os tipos de produtos baseado em seus nomes

const mongoose = require('mongoose');
const config = require('../config');

// Carregar modelo Product
require('../models/Product');

// Conectar ao banco de dados
mongoose.connect(config.MONGODB_URI, {});

const Product = mongoose.model('Product');

async function fixProductTypes() {
  try {
    console.log('🔄 Corrigindo tipos de produtos...\n');

    // Produtos que definitivamente são bebidas
    const beverageProducts = [
      'Água Mineral sem Gás',
      'Água Mineral com Gás',
      'Refrigerante',
      'Suco Natural',
      'Cerveja Brahma',
      'Cerveja Heineken',
      'Cerveja Corona',
      'Caipirinha',
      'Margarita',
      'Gin Tônica'
    ];

    let beverageCount = 0;
    let foodCount = 0;

    for (const productName of beverageProducts) {
      const result = await Product.updateOne(
        { name: productName },
        { $set: { productType: 'beverage' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`🍹 "${productName}" → beverage`);
        beverageCount++;
      }
    }

    // Produtos que são comida
    const foodProducts = [
      'Batata Frita',
      'Isca de Peixe',
      'Carne de Sol com Mandioca',
      'Moqueca de Camarão',
      'Peixe Grelhado',
      'Camarão ao Alho e Óleo'
    ];

    for (const productName of foodProducts) {
      const result = await Product.updateOne(
        { name: productName },
        { $set: { productType: 'food' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`🍔 "${productName}" → food`);
        foodCount++;
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   🍹 Bebidas atualizadas: ${beverageCount}`);
    console.log(`   🍔 Comidas confirmadas: ${foodCount}\n`);

    // Listar todos os produtos e seus tipos
    const allProducts = await Product.find({}).select('name productType');
    console.log('📋 Lista completa de produtos:\n');

    const grouped = allProducts.reduce((acc, p) => {
      if (!acc[p.productType]) acc[p.productType] = [];
      acc[p.productType].push(p.name);
      return acc;
    }, {});

    if (grouped.food) {
      console.log('🍔 COMIDA (vai para COZINHA):');
      grouped.food.forEach(name => console.log(`   - ${name}`));
      console.log('');
    }

    if (grouped.beverage) {
      console.log('🍹 BEBIDA (vai para GARÇOM):');
      grouped.beverage.forEach(name => console.log(`   - ${name}`));
      console.log('');
    }

    mongoose.connection.close();
    console.log('✅ Correção concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

fixProductTypes();
