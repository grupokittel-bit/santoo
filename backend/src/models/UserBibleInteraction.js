// MODELO USER BIBLE INTERACTION
// Define como as interações dos usuários com posts da Bíblia ficam salvos

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserBibleInteraction = sequelize.define('UserBibleInteraction', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === RELACIONAMENTOS ===
  user_id: {
    type: DataTypes.UUID,           // ID do usuário que interagiu
    allowNull: false,               // Obrigatório
    references: {
      model: 'users',               // Referencia tabela users
      key: 'id'
    }
  },
  
  bible_post_id: {
    type: DataTypes.UUID,           // ID do post da Bíblia
    allowNull: false,               // Obrigatório
    references: {
      model: 'bible_posts',         // Referencia tabela bible_posts
      key: 'id'
    }
  },
  
  // === TIPO DE INTERAÇÃO ===
  interaction_type: {
    type: DataTypes.ENUM(
      'like',                       // ❤️ Curtiu o post
      'amen',                       // 🙏 "Já faço isso" - usuário pratica esse ensinamento
      'ops',                        // 😅 "Ainda não faço isso" - usuário quer começar a praticar
      'disagree'                    // ❌ Discorda da explicação
    ),
    allowNull: false,               // Obrigatório
    validate: {
      isIn: {
        args: [['like', 'amen', 'ops', 'disagree']],
        msg: 'Tipo de interação inválido'
      }
    }
  },
  
  // === METADADOS DA INTERAÇÃO ===
  interaction_value: {
    type: DataTypes.INTEGER,        // Valor da interação (1 = ativou, 0 = desativou)
    allowNull: false,
    defaultValue: 1,
    validate: {
      isIn: {
        args: [[0, 1]],
        msg: 'Valor deve ser 0 ou 1'
      }
    }
  },
  
  // === DADOS CONTEXTUAIS ===
  user_agent: {
    type: DataTypes.STRING(500),    // Browser/dispositivo usado
    allowNull: true                 // Opcional para analytics
  },
  
  ip_address: {
    type: DataTypes.STRING(45),     // IP do usuário (IPv4 ou IPv6)
    allowNull: true,                // Opcional para analytics
    validate: {
      isIP: true                    // Validação de formato IP
    }
  },
  
  // === DADOS PARA ALGORITMO ===
  session_time: {
    type: DataTypes.INTEGER,        // Tempo em segundos que ficou no post
    allowNull: true,                // Opcional
    validate: { min: 0 }
  },
  
  reading_progress: {
    type: DataTypes.FLOAT,          // % do post que leu (0.0 a 1.0)
    allowNull: true,                // Opcional
    validate: { 
      min: 0.0,
      max: 1.0
    }
  },
  
  // === CONTEXTO DA INTERAÇÃO ===
  interaction_source: {
    type: DataTypes.ENUM(
      'feed',                       // Via feed principal
      'search',                     // Via busca
      'profile',                    // Via perfil próprio
      'direct_link',                // Link direto
      'notification',               // Via notificação
      'share'                       // Via compartilhamento
    ),
    allowNull: true,                // Opcional
    defaultValue: 'feed'
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'user_bible_interactions',
  timestamps: true,                 // Adiciona createdAt e updatedAt
  paranoid: false,                  // Não usar soft delete (queremos histórico completo)
  
  // === ÍNDICES PARA PERFORMANCE ===
  indexes: [
    {
      fields: ['user_id'],          // Buscar interações por usuário
      name: 'user_interactions_idx'
    },
    {
      fields: ['bible_post_id'],    // Buscar interações por post
      name: 'post_interactions_idx'
    },
    {
      fields: ['interaction_type'], // Buscar por tipo de interação
      name: 'interaction_type_idx'
    },
    {
      fields: ['user_id', 'bible_post_id'], // Busca combinada (evitar duplicatas)
      name: 'user_post_unique_idx'
    },
    {
      fields: ['user_id', 'interaction_type'], // Buscar "todos os amém do usuário"
      name: 'user_type_interactions_idx'
    },
    {
      fields: ['createdAt'],        // Ordenar por data
      name: 'interaction_date_idx'
    }
  ],
  
  // === VALIDAÇÕES ÚNICAS ===
  // Um usuário só pode ter UMA interação do mesmo tipo por post
  uniqueKeys: {
    user_post_interaction_unique: {
      fields: ['user_id', 'bible_post_id', 'interaction_type']
    }
  }
});

// === MÉTODOS ESTÁTICOS ===

// Busca todas as interações de um usuário por tipo
UserBibleInteraction.findUserInteractionsByType = async function(userId, interactionType) {
  return await this.findAll({
    where: {
      user_id: userId,
      interaction_type: interactionType,
      interaction_value: 1          // Apenas interações ativas
    },
    include: [{
      model: require('./BiblePost'),
      as: 'biblePost',
      where: { is_active: true }     // Apenas posts ativos
    }],
    order: [['createdAt', 'DESC']]
  });
};

// Busca interação específica de usuário em post
UserBibleInteraction.findUserPostInteraction = async function(userId, biblePostId, interactionType) {
  return await this.findOne({
    where: {
      user_id: userId,
      bible_post_id: biblePostId,
      interaction_type: interactionType
    }
  });
};

// Conta interações por tipo para um post
UserBibleInteraction.countInteractionsByPost = async function(biblePostId, interactionType) {
  return await this.count({
    where: {
      bible_post_id: biblePostId,
      interaction_type: interactionType,
      interaction_value: 1
    }
  });
};

// Busca posts mais interagidos por categoria
UserBibleInteraction.getTopPostsByCategory = async function(category, interactionType, limit = 10) {
  return await this.findAll({
    attributes: [
      'bible_post_id',
      [sequelize.fn('COUNT', sequelize.col('id')), 'interaction_count']
    ],
    where: {
      interaction_type: interactionType,
      interaction_value: 1
    },
    include: [{
      model: require('./BiblePost'),
      as: 'biblePost',
      where: { 
        category: category,
        is_active: true 
      }
    }],
    group: ['bible_post_id', 'biblePost.id'],
    order: [[sequelize.literal('interaction_count'), 'DESC']],
    limit: limit
  });
};

// === MÉTODOS DE INSTÂNCIA ===

// Ativar/desativar interação
UserBibleInteraction.prototype.toggle = async function() {
  this.interaction_value = this.interaction_value === 1 ? 0 : 1;
  return await this.save();
};

// Verificar se interação está ativa
UserBibleInteraction.prototype.isActive = function() {
  return this.interaction_value === 1;
};

// Dados para API
UserBibleInteraction.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    type: this.interaction_type,
    is_active: this.isActive(),
    created_at: this.createdAt,
    updated_at: this.updatedAt
  };
};

module.exports = UserBibleInteraction;