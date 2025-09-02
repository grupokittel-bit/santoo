// MODELO DE COMENTÁRIO
// Define comentários dos usuários nos vídeos

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === CONTEÚDO ===
  content: {
    type: DataTypes.TEXT,           // Texto do comentário
    allowNull: false,               // Obrigatório
    validate: {
      len: [1, 1000]                // Entre 1 e 1000 caracteres
    }
  },
  
  // === MODERAÇÃO ===
  isActive: {
    type: DataTypes.BOOLEAN,        // Comentário ativo?
    defaultValue: true
  },
  
  isEdited: {
    type: DataTypes.BOOLEAN,        // Foi editado?
    defaultValue: false
  },
  
  editedAt: {
    type: DataTypes.DATE,           // Data da edição
    allowNull: true
  },
  
  // === RELACIONAMENTOS ===
  userId: {
    type: DataTypes.UUID,           // ID do usuário que comentou
    allowNull: false,               // Obrigatório
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  videoId: {
    type: DataTypes.UUID,           // ID do vídeo comentado
    allowNull: false,               // Obrigatório
    references: {
      model: 'videos', 
      key: 'id'
    }
  },
  
  // === COMENTÁRIO ANINHADO (RESPOSTA) ===
  parentId: {
    type: DataTypes.UUID,           // ID do comentário pai (se for resposta)
    allowNull: true,                // Opcional
    references: {
      model: 'comments',
      key: 'id'
    }
  },
  
  // === ESTATÍSTICAS ===
  likesCount: {
    type: DataTypes.INTEGER,        // Curtidas no comentário
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  repliesCount: {
    type: DataTypes.INTEGER,        // Respostas ao comentário
    defaultValue: 0,
    validate: { min: 0 }
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'comments',            // Nome da tabela no banco
  timestamps: true,                 // Adiciona createdAt e updatedAt
  paranoid: true,                   // Soft delete
  
  // === ÍNDICES ===
  indexes: [
    {
      fields: ['videoId']           // Busca por vídeo
    },
    {
      fields: ['userId']            // Busca por usuário
    },
    {
      fields: ['parentId']          // Busca respostas
    },
    {
      fields: ['isActive', 'createdAt'] // Listagem ordenada
    }
  ]
});

// === MÉTODOS DO COMENTÁRIO ===

// Retorna dados públicos do comentário
Comment.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    content: this.content,
    isEdited: this.isEdited,
    editedAt: this.editedAt,
    likesCount: this.likesCount,
    repliesCount: this.repliesCount,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    // Dados dos relacionamentos
    User: this.User ? this.User.toPublicJSON() : null,
    parentId: this.parentId
  };
};

module.exports = Comment;