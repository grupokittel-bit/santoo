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

// === ARQUIVOS ESTÁTICOS ===
// Middleware para arquivos de upload com headers CORP apropriados
app.use('/uploads', (req, res, next) => {
  // Headers CORP para permitir cross-origin requests
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Headers específicos para SVG e cache otimizado
  if (req.path.endsWith('.svg')) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
  }
  
  // Headers para imagens em geral
  if (req.path.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 dias cache
  }
  
  next();
}, express.static('src/uploads')); // Serve arquivos de upload

// === ROTAS DA API ===
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/bible-posts', require('./routes/biblePosts'));

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
      console.log('   GET  /health - Saúde do sistema');
      console.log('');
      console.log('🔐 AUTENTICAÇÃO:');
      console.log('   POST /api/auth/register - Criar conta');
      console.log('   POST /api/auth/login - Fazer login');
      console.log('   POST /api/auth/verify - Verificar token');
      console.log('');
      console.log('👥 USUÁRIOS:');
      console.log('   GET  /api/users - Listar usuários');
      console.log('   GET  /api/users/:username - Perfil público');
      console.log('   GET  /api/users/me - Meu perfil');
      console.log('   PUT  /api/users/me - Atualizar perfil');
      console.log('   POST /api/users/:id/follow - Seguir usuário');
      console.log('');
      console.log('🎥 VÍDEOS:');
      console.log('   GET  /api/videos - Feed de vídeos');
      console.log('   POST /api/videos - Upload de vídeo');
      console.log('   GET  /api/videos/:id - Detalhes do vídeo');
      console.log('   POST /api/videos/:id/like - Curtir vídeo');
      console.log('');
      console.log('📂 CATEGORIAS:');
      console.log('   GET  /api/categories - Listar categorias');
      console.log('   GET  /api/categories/:id - Vídeos da categoria');
      console.log('');
      console.log('💬 COMENTÁRIOS:');
      console.log('   GET  /api/comments/video/:id - Comentários do vídeo');
      console.log('   POST /api/comments - Adicionar comentário');
      console.log('');
      console.log('📖 BÍBLIA EXPLICADA:');
      console.log('   GET  /api/bible-posts - Feed personalizado');
      console.log('   POST /api/bible-posts - Criar post (admin)');
      console.log('   POST /api/bible-posts/:id/interact - Interagir (amém/ops)');
      console.log('   GET  /api/bible-posts/my-interactions/:type - Minhas interações');
      console.log('   POST /api/bible-posts/:id/disagree - Discordar do post');
      console.log('   GET  /api/bible-posts/admin/disagreements - Painel admin');
      console.log('   PUT  /api/bible-posts/admin/disagreements/:id - Analisar');
      console.log('');
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