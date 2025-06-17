// utils/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Modelos
const User = require('../models/User');
const Table = require('../models/Table');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
// Adicionar esta linha para importar o modelo CashRegister
const CashRegister = require('../models/CashRegister');
// E esta para o modelo CashTransaction, se necessário
const CashTransaction = require('../models/CashTransaction');


// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marambaia_pdv', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB conectado para seed'))
.catch(err => {
  console.error('Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

const cashRegistersData = [
  { 
    identifier: 'Caixa 1',
    currentBalance: 0,
    status: 'closed'
  },
  { 
    identifier: 'Caixa 2',
    currentBalance: 0,
    status: 'closed'
  }
];

// Dados para seed
const usersData = [
  {
    name: 'Administrador',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    active: true
  },
  {
    name: 'Gerente',
    username: 'gerente',
    password: 'gerente123',
    role: 'manager',
    active: true
  },
  {
    name: 'Carlos (Garçom)',
    username: 'carlos',
    password: 'carlos123',
    role: 'waiter',
    active: true
  },
  {
    name: 'Ana (Garçom)',
    username: 'ana',
    password: 'ana123',
    role: 'waiter',
    active: true
  },
  {
    name: 'Cozinha',
    username: 'cozinha',
    password: 'cozinha123',
    role: 'kitchen',
    active: true
  }
];

const tablesData = [
  { number: '1', section: 'praia', position: { x: 0, y: 0 } },
  { number: '2', section: 'praia', position: { x: 1, y: 0 } },
  { number: '3', section: 'praia', position: { x: 2, y: 0 } },
  { number: '4', section: 'praia', position: { x: 0, y: 1 } },
  { number: '5', section: 'praia', position: { x: 1, y: 1 } },
  { number: '6', section: 'praia', position: { x: 2, y: 1 } },
  { number: '7', section: 'deck', position: { x: 0, y: 0 } },
  { number: '8', section: 'deck', position: { x: 1, y: 0 } },
  { number: '9', section: 'deck', position: { x: 2, y: 0 } },
  { number: '10', section: 'deck', position: { x: 0, y: 1 } }
];

const categoriesData = [
  { 
    name: 'Bebidas', 
    description: 'Refrigerantes, sucos, águas, etc.', 
    order: 1 
  },
  { 
    name: 'Cervejas', 
    description: 'Cervejas nacionais e importadas', 
    order: 2 
  },
  { 
    name: 'Drinks', 
    description: 'Caipirinhas, drinks com vodka, gin, etc.', 
    order: 3 
  },
  { 
    name: 'Porções', 
    description: 'Petiscos e porções para compartilhar', 
    order: 4 
  },
  { 
    name: 'Frutos do Mar', 
    description: 'Pratos com peixes e frutos do mar', 
    order: 5 
  }
];

// Função para criar produtos com base nas categorias
const createProductsData = (categories) => {
  const categoriesMap = {};
  categories.forEach(cat => {
    categoriesMap[cat.name] = cat._id;
  });
  
  return [
    // Bebidas
    {
      name: 'Água Mineral sem Gás',
      description: 'Garrafa 500ml',
      price: 5.00,
      category: categoriesMap['Bebidas'],
      available: true,
      featured: false,
      preparationTime: 1
    },
    {
      name: 'Água Mineral com Gás',
      description: 'Garrafa 500ml',
      price: 5.50,
      category: categoriesMap['Bebidas'],
      available: true,
      featured: false,
      preparationTime: 1
    },
    {
      name: 'Refrigerante',
      description: 'Lata 350ml - Coca-Cola, Guaraná, Sprite',
      price: 6.00,
      category: categoriesMap['Bebidas'],
      available: true,
      featured: true,
      preparationTime: 1
    },
    {
      name: 'Suco Natural',
      description: 'Laranja, abacaxi, maracujá, limão (400ml)',
      price: 10.00,
      category: categoriesMap['Bebidas'],
      available: true,
      featured: true,
      preparationTime: 5
    },
    
    // Cervejas
    {
      name: 'Cerveja Brahma',
      description: 'Lata 350ml',
      price: 8.00,
      category: categoriesMap['Cervejas'],
      available: true,
      featured: false,
      preparationTime: 1
    },
    {
      name: 'Cerveja Heineken',
      description: 'Long Neck 330ml',
      price: 12.00,
      category: categoriesMap['Cervejas'],
      available: true,
      featured: true,
      preparationTime: 1
    },
    {
      name: 'Cerveja Corona',
      description: 'Long Neck 330ml',
      price: 12.00,
      category: categoriesMap['Cervejas'],
      available: true,
      featured: false,
      preparationTime: 1
    },
    
    // Drinks
    {
      name: 'Caipirinha',
      description: 'Cachaça, limão, açúcar e gelo',
      price: 15.00,
      category: categoriesMap['Drinks'],
      available: true,
      featured: true,
      preparationTime: 8
    },
    {
      name: 'Margarita',
      description: 'Tequila, suco de limão, triple sec e sal',
      price: 20.00,
      category: categoriesMap['Drinks'],
      available: true,
      featured: false,
      preparationTime: 10
    },
    {
      name: 'Gin Tônica',
      description: 'Gin, água tônica, limão e especiarias',
      price: 25.00,
      category: categoriesMap['Drinks'],
      available: true,
      featured: true,
      preparationTime: 8
    },
    
    // Porções
    {
      name: 'Batata Frita',
      description: 'Porção grande com molho especial',
      price: 25.00,
      category: categoriesMap['Porções'],
      available: true,
      featured: true,
      preparationTime: 15
    },
    {
      name: 'Isca de Peixe',
      description: 'Iscas de tilápia empanadas',
      price: 40.00,
      category: categoriesMap['Porções'],
      available: true,
      featured: true,
      preparationTime: 20
    },
    {
      name: 'Carne de Sol com Mandioca',
      description: 'Carne de sol frita com mandioca cozida',
      price: 45.00,
      category: categoriesMap['Porções'],
      available: true,
      featured: false,
      preparationTime: 25
    },
    
    // Frutos do Mar
    {
      name: 'Moqueca de Camarão',
      description: 'Moqueca de camarão com arroz e pirão',
      price: 60.00,
      category: categoriesMap['Frutos do Mar'],
      available: true,
      featured: true,
      preparationTime: 30
    },
    {
      name: 'Peixe Grelhado',
      description: 'Filé de peixe grelhado com legumes e arroz',
      price: 45.00,
      category: categoriesMap['Frutos do Mar'],
      available: true,
      featured: false,
      preparationTime: 25
    },
    {
      name: 'Camarão ao Alho e Óleo',
      description: 'Camarões salteados com alho e óleo e arroz',
      price: 55.00,
      category: categoriesMap['Frutos do Mar'],
      available: true,
      featured: true,
      preparationTime: 20
    }
  ];
};


// Função para realizar o seed
const seedDatabase = async () => {
  try {
    // Limpar TODAS as coleções do banco de dados
    await User.deleteMany({});
    await Table.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await CashRegister.deleteMany({}); // Agora pode usar CashRegister
    await CashTransaction.deleteMany({}); // Adicionar se necessário
    
    console.log('Banco de dados completamente limpo');
    
    // Inserir usuários
    const users = [];
    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      users.push({
        ...userData,
        password: hashedPassword
      });
    }
    await User.insertMany(users);
    console.log(`${users.length} usuários inseridos`);
    
    // Inserir mesas
    await Table.insertMany(tablesData);
    console.log(`${tablesData.length} mesas inseridas`);
    
    // Inserir categorias
    const categories = await Category.insertMany(categoriesData);
    console.log(`${categories.length} categorias inseridas`);
    
    // Inserir produtos
    const productsData = createProductsData(categories);
    await Product.insertMany(productsData);
    console.log(`${productsData.length} produtos inseridos`);
    
    const cashRegistersData = [
      { 
        identifier: 'Caixa 1',
        currentBalance: 0,
        status: 'closed'
      },
      { 
        identifier: 'Caixa 2',
        currentBalance: 0,
        status: 'closed'
      }
    ];
    
    await CashRegister.insertMany(cashRegistersData);
    console.log(`${cashRegistersData.length} caixas inseridos`);

    console.log('Seed concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro durante o seed:', error);
    process.exit(1);
  }
};

// Executar seed
seedDatabase();