// ARQUIVO CENTRAL DOS MODELOS
// Importa todos os modelos e suas associações

const { sequelize } = require('../config/database');

// Importa todos os modelos
const User = require('./User');
const Video = require('./Video');
const Category = require('./Category');
const Comment = require('./Comment');
const Like = require('./Like');
const Follow = require('./Follow');

// Importa e configura associações
require('./associations');

// Função para sincronizar banco (criar tabelas)
async function syncDatabase(force = false) {
  try {
    console.log('🔄 Sincronizando banco de dados...\n');
    
    // Sincroniza todas as tabelas
    await sequelize.sync({ 
      force,        // true = apaga e recria tudo; false = só cria o que não existe
      alter: !force // true = altera estrutura existente para coincidir com modelos
    });
    
    if (force) {
      console.log('⚠️  ATENÇÃO: Todas as tabelas foram recriadas (dados perdidos)');
    } else {
      console.log('✅ Tabelas sincronizadas (dados preservados)');
    }
    
    // Cria categorias padrão
    await Category.createDefaultCategories();
    
    console.log('🎉 BANCO DE DADOS CONFIGURADO COM SUCESSO!\n');
    
    // Lista tabelas criadas
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📊 TABELAS NO BANCO:');
    tables.forEach(table => console.log(`   ✅ ${table}`));
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ ERRO ao sincronizar banco:', error);
    return false;
  }
}

// Função para testar modelos
async function testModels() {
  try {
    console.log('🧪 TESTANDO MODELOS...\n');
    
    // Testa cada modelo
    const tests = [
      { model: User, name: 'User' },
      { model: Category, name: 'Category' },
      { model: Video, name: 'Video' },
      { model: Comment, name: 'Comment' },
      { model: Like, name: 'Like' },
      { model: Follow, name: 'Follow' }
    ];
    
    for (const test of tests) {
      try {
        await test.model.findAll({ limit: 1 });
        console.log(`   ✅ ${test.name} - OK`);
      } catch (error) {
        console.log(`   ❌ ${test.name} - ERRO: ${error.message}`);
      }
    }
    
    console.log('\n🎉 TESTE DE MODELOS CONCLUÍDO!');
    return true;
  } catch (error) {
    console.error('❌ ERRO nos testes:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  
  // Modelos
  User,
  Video,
  Category,
  Comment,
  Like,
  Follow,
  
  // Funções utilitárias
  syncDatabase,
  testModels
};