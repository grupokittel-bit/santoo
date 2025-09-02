// ROTA DE AUTENTICAÇÃO
// Endpoints para login, registro e gerenciamento de JWT

const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { User } = require('../models');

const router = express.Router();

// === RATE LIMITING PARA SEGURANÇA ===
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  }
});

// === FUNÇÕES UTILITÁRIAS ===

// Gera token JWT
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token válido por 7 dias
  );
}

// === ROTAS DE AUTENTICAÇÃO ===

// POST /auth/register - Registro de novo usuário
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      displayName,
      bio 
    } = req.body;
    
    // 1. Validações básicas
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email e password são obrigatórios'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password deve ter pelo menos 6 caracteres'
      });
    }
    
    // 2. Verifica se usuário já existe
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: 'Username ou email já está em uso'
      });
    }
    
    // 3. Cria o usuário
    const user = await User.create({
      username,
      email,
      password, // Será criptografado automaticamente pelo modelo
      displayName: displayName || username,
      bio: bio || 'Novo membro da comunidade Santoo!'
    });
    
    // 4. Gera token para login automático
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      token,
      user: user.toPublicJSON()
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    
    // Se erro de validação do Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /auth/login - Login de usuário existente
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier pode ser username ou email
    
    // 1. Validações básicas
    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Username/email e password são obrigatórios'
      });
    }
    
    // 2. Busca usuário por username ou email
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }
    
    // 3. Verifica senha
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }
    
    // 4. Atualiza último login
    await user.update({ lastLogin: new Date() });
    
    // 5. Gera token
    const token = generateToken(user);
    
    res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: user.toPublicJSON()
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /auth/verify - Verifica se token JWT é válido
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token é obrigatório'
      });
    }
    
    // Decodifica token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Busca usuário para confirmar que ainda existe
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado'
      });
    }
    
    res.json({
      valid: true,
      user: user.toPublicJSON()
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }
    
    console.error('Erro na verificação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /auth/refresh - Renova token JWT (opcional)
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token é obrigatório'
      });
    }
    
    // Verifica token atual (mesmo que expirado)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    // Busca usuário
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado'
      });
    }
    
    // Gera novo token
    const newToken = generateToken(user);
    
    res.json({
      message: 'Token renovado com sucesso!',
      token: newToken,
      user: user.toPublicJSON()
    });
    
  } catch (error) {
    console.error('Erro na renovação:', error);
    res.status(401).json({
      error: 'Não foi possível renovar o token'
    });
  }
});

module.exports = router;