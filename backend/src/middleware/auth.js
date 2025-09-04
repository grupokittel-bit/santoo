// MIDDLEWARE DE AUTENTICAÇÃO JWT
// Verifica se o usuário está logado antes de acessar rotas protegidas

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// === MIDDLEWARE PRINCIPAL DE AUTENTICAÇÃO ===
async function authMiddleware(req, res, next) {
  try {
    // 1. Pega token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de acesso necessário'
      });
    }
    
    // 2. Extrai token (formato: "Bearer token123...")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    // 3. Verifica e decodifica token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Busca usuário no banco
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado'
      });
    }
    
    // 5. Adiciona usuário ao request para próximas funções
    req.user = user;
    req.userId = user.id; // Atalho útil
    
    next(); // Continua para próximo middleware/rota
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Faça login novamente.'
      });
    }
    
    console.error('Erro no middleware auth:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
}

// === MIDDLEWARE OPCIONAL (não obriga login) ===
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findByPk(decoded.id);
          
          if (user) {
            req.user = user;
            req.userId = user.id;
          }
        } catch (error) {
          // Token inválido/expirado - continua sem usuário
          console.log('Token opcional inválido:', error.message);
        }
      }
    }
    
    next(); // Sempre continua, com ou sem usuário
    
  } catch (error) {
    console.error('Erro no middleware opcional:', error);
    next(); // Continua mesmo com erro
  }
}

// === MIDDLEWARE PARA ADMIN (futuro) ===
function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Login necessário'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores.'
    });
  }
  
  next();
}

// === MIDDLEWARE PARA CRIADORES DE POSTS BÍBLICOS (admin/pastor) ===
function biblePostCreatorOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Login necessário'
    });
  }
  
  if (!req.user.canCreateBiblePosts()) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores e pastores podem criar posts bíblicos.'
    });
  }
  
  next();
}

// === MIDDLEWARE PARA MODERADORES DE DISCORDÂNCIAS (admin/pastor) ===  
function bibleModeratorOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Login necessário'
    });
  }
  
  if (!req.user.canModerateBibleDisagreements()) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores e pastores podem moderar discordâncias.'
    });
  }
  
  next();
}

// === MIDDLEWARE PARA VERIFICADOS (futuro) ===
function verifiedOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Login necessário'
    });
  }
  
  if (!req.user.isVerified) {
    return res.status(403).json({
      error: 'Acesso negado. Apenas usuários verificados.'
    });
  }
  
  next();
}

module.exports = {
  authMiddleware,           // Obrigatório: precisa estar logado
  optionalAuth,            // Opcional: pode ou não estar logado  
  adminOnly,               // Obrigatório: precisa ser admin
  verifiedOnly,            // Obrigatório: precisa ser verificado
  biblePostCreatorOnly,    // Obrigatório: admin/pastor para criar posts bíblicos
  bibleModeratorOnly,      // Obrigatório: admin/pastor para moderar discordâncias
  
  // Alias para facilitar uso
  required: authMiddleware,
  optional: optionalAuth,
  adminMiddleware: bibleModeratorOnly,  // Alias para compatibilidade
  pastorMiddleware: biblePostCreatorOnly // Alias para compatibilidade
};