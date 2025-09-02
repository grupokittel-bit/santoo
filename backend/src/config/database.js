// CONFIGURAÇÃO DE CONEXÃO COM POSTGRESQL
// Este arquivo ensina o backend como conectar com o banco de dados

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Pega as configurações do arquivo .env (senhas ficam seguras lá)
const sequelize = new Sequelize({
  database: process.env.DB_NAME,     // nome do banco: 'santoo'
  username: process.env.DB_USER,     // usuário: 'postgres' 
  password: process.env.DB_PASSWORD, // senha: '123456'
  host: process.env.DB_HOST,         // servidor: 'localhost'
  port: process.env.DB_PORT,         // porta: 5435
  dialect: 'postgres',               // tipo do banco: PostgreSQL
  
  // Configurações extras para melhor performance
  pool: {
    max: 10,        // máximo 10 conexões simultâneas
    min: 0,         // mínimo 0 conexões
    acquire: 30000, // tempo limite para conectar: 30 segundos
    idle: 10000     // tempo para fechar conexão ociosa: 10 segundos
  },
  
  // Configurações de log (vamos ver as consultas SQL no console)
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Configurações de timezone
  timezone: '-03:00', // Brasília (UTC-3)
  
  // Configurações SSL (não precisamos em desenvolvimento local)
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Função para testar a conexão
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ CONEXÃO COM POSTGRESQL FUNCIONANDO!');
    console.log(`📊 Banco: ${process.env.DB_NAME} na porta ${process.env.DB_PORT}`);
    return true;
  } catch (error) {
    console.error('❌ ERRO AO CONECTAR COM POSTGRESQL:', error.message);
    return false;
  }
}

module.exports = { sequelize, testConnection };