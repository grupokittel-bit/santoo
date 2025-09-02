// SCRIPT PARA CRIAR O BANCO DE DADOS "SANTOO"
// Este script cria o banco automaticamente

const { Client } = require('pg');
require('dotenv').config();

// Configuração para conectar SEM especificar banco (para criar o banco)
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // NÃO colocamos 'database' aqui porque vamos criar ele
});

async function createDatabase() {
  try {
    // Conecta ao PostgreSQL (sem banco específico)
    await client.connect();
    console.log('🔌 Conectado ao PostgreSQL!');
    
    // Verifica se o banco "santoo" já existe
    const checkResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('ℹ️  Banco "santoo" já existe!');
    } else {
      // Cria o banco "santoo"
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log('✅ Banco "santoo" criado com sucesso!');
    }
    
    await client.end();
    console.log('🎉 PROCESSO CONCLUÍDO!\n');
    
  } catch (error) {
    console.error('❌ ERRO ao criar banco:', error.message);
    process.exit(1);
  }
}

// Executa a criação do banco
console.log('📊 CRIANDO BANCO DE DADOS "SANTOO"...\n');
createDatabase();