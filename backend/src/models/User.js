// MODELO DE USUÁRIO
// Define como os dados dos usuários ficam salvos no banco

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === DADOS BÁSICOS ===
  username: {
    type: DataTypes.STRING(50),     // Nome de usuário (máx 50 chars)
    allowNull: false,               // Obrigatório
    unique: true,                   // Único no sistema
    validate: {
      len: [3, 50],                 // Entre 3 e 50 caracteres
      isAlphanumeric: true          // Só letras e números
    }
  },
  
  email: {
    type: DataTypes.STRING(100),    // Email (máx 100 chars)
    allowNull: false,               // Obrigatório
    unique: true,                   // Único no sistema
    validate: {
      isEmail: true                 // Formato de email válido
    }
  },
  
  password: {
    type: DataTypes.STRING(255),    // Senha criptografada
    allowNull: false,               // Obrigatório
    validate: {
      len: [6, 255]                 // Mínimo 6 caracteres
    }
  },
  
  // === DADOS DO PERFIL ===
  displayName: {
    type: DataTypes.STRING(100),    // Nome exibido no perfil
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  
  bio: {
    type: DataTypes.TEXT,           // Biografia/descrição
    allowNull: true,                // Opcional
    validate: {
      len: [0, 500]                 // Máximo 500 caracteres
    }
  },
  
  avatar: {
    type: DataTypes.STRING(255),    // URL da foto do perfil
    allowNull: true,                // Opcional
    defaultValue: null
  },
  
  coverImage: {
    type: DataTypes.STRING(255),    // URL da capa do perfil
    allowNull: true,                // Opcional
    defaultValue: null
  },
  
  // === CONFIGURAÇÕES ===
  isVerified: {
    type: DataTypes.BOOLEAN,        // Conta verificada?
    defaultValue: false
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,        // Conta ativa?
    defaultValue: true
  },
  
  role: {
    type: DataTypes.ENUM('user', 'moderator', 'admin'), // Tipo de usuário
    defaultValue: 'user'
  },
  
  // === ESTATÍSTICAS ===
  followersCount: {
    type: DataTypes.INTEGER,        // Número de seguidores
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  followingCount: {
    type: DataTypes.INTEGER,        // Número seguindo
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  videosCount: {
    type: DataTypes.INTEGER,        // Número de vídeos
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  // === DATAS ===
  lastLogin: {
    type: DataTypes.DATE,           // Último login
    allowNull: true
  },
  
  emailVerifiedAt: {
    type: DataTypes.DATE,           // Email verificado em
    allowNull: true
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'users',               // Nome da tabela no banco
  timestamps: true,                 // Adiciona createdAt e updatedAt
  paranoid: true,                   // Soft delete (não exclui, marca como deletado)
  
  // === HOOKS (AÇÕES AUTOMÁTICAS) ===
  hooks: {
    // Antes de criar usuário, criptografa senha
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    
    // Antes de atualizar, se mudou senha, criptografa
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// === MÉTODOS DO USUÁRIO ===

// Verifica se senha está correta
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Retorna dados públicos do usuário (sem senha)
User.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    username: this.username,
    displayName: this.displayName,
    bio: this.bio,
    avatar: this.avatar,
    coverImage: this.coverImage,
    isVerified: this.isVerified,
    followersCount: this.followersCount,
    followingCount: this.followingCount,
    videosCount: this.videosCount,
    createdAt: this.createdAt
  };
};

module.exports = User;