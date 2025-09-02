// SERVIDOR PRINCIPAL DO SANTOO BACKEND
// Este é o "coração" que recebe todos os pedidos

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Importa a conexão com banco e modelos
const { sequelize, testConnection } = require('./config/database');
const models = require('./models');

// Cria o servidor Express
const app = express();
const PORT = process.env.PORT || 3001;

// === MIDDLEWARES DE SEGURANÇA ===
app.use(helmet()); // Proteção básica contra ataques
app.use(compression()); // Comprime respostas para economizar banda

// === MIDDLEWARES DE REQUISIÇÃO ===
app.use(express.json({ limit: '10mb' })); // Parse JSON até 10MB
app.use(express.urlencoded({ extended: true })); // Parse formulários

// === CORS - Permite frontend conversar com backend ===
app.use(cors({
  origin: [
    'http://localhost:8000',  // Frontend em desenvolvimento
    'http://127.0.0.1:8000',  // Frontend alternativo
    'http://localhost:3000',  // Preview do frontend
    'https://santoo.app'      // Produção (futuro)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// === LOGGING ===
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined')); // Log detalhado em desenvolvimento
}

// === ROTAS BÁSICAS ===

// Rota de teste - verifica se servidor está funcionando
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Santoo Backend funcionando!',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Rota de saúde - verifica servidor + banco
app.get('/health', async (req, res) => {
  try {
    // Testa conexão com banco
    await sequelize.authenticate();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// === IMPORTAR ROTAS (vamos criar depois) ===
// app.use('/api/users', require('./routes/users'));
// app.use('/api/videos', require('./routes/videos'));
// app.use('/api/auth', require('./routes/auth'));

// === MIDDLEWARE DE ERRO GLOBAL ===
app.use((error, req, res, next) => {
  console.error('🚨 ERRO:', error);
  
  res.status(error.status || 500).json({
    message: 'Algo deu errado no servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
    timestamp: new Date().toISOString()
  });
});

// === ROTA 404 - Não encontrado ===
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Rota não encontrada',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// === INICIALIZAÇÃO DO SERVIDOR ===
async function startServer() {
  try {
    console.log('🚀 Iniciando Santoo Backend...\n');
    
    // 1. Testa conexão com banco
    console.log('📊 Testando PostgreSQL...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Não foi possível conectar com PostgreSQL!');
      process.exit(1);
    }
    
    // 2. Sincroniza modelos com banco (quando criarmos)
    // await sequelize.sync({ alter: true });
    
    // 3. Inicia o servidor
    app.listen(PORT, () => {
      console.log('✅ SANTOO BACKEND ONLINE!');
      console.log(`🌐 Servidor: http://localhost:${PORT}`);
      console.log(`📊 Banco: santoo na porta ${process.env.DB_PORT}`);
      console.log(`🛡️  Ambiente: ${process.env.NODE_ENV}`);
      console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);
      
      console.log('📋 ROTAS DISPONÍVEIS:');
      console.log('   GET  / - Status do servidor');
      console.log('   GET  /health - Saúde do sistema\n');
    });
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Exporta para testes
module.exports = app;