// MODELO BIBLE DISAGREEMENT
// Define como as discordâncias dos usuários com explicações ficam salvos

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BibleDisagreement = sequelize.define('BibleDisagreement', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === RELACIONAMENTOS ===
  user_id: {
    type: DataTypes.UUID,           // ID do usuário que discordou
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
  
  // === CONTEÚDO DA DISCORDÂNCIA ===
  reason: {
    type: DataTypes.STRING(200),    // Motivo resumido da discordância
    allowNull: false,               // Obrigatório
    validate: {
      len: [10, 200],               // Entre 10 e 200 caracteres
      notEmpty: true
    }
  },
  
  description: {
    type: DataTypes.TEXT,           // Explicação detalhada do por que discorda
    allowNull: false,               // Obrigatório
    validate: {
      len: [20, 2000],              // Entre 20 e 2000 caracteres
      notEmpty: true
    }
  },
  
  // === CAMPOS ESPECÍFICOS DE DISCORDÂNCIA ===
  disagreement_type: {
    type: DataTypes.ENUM(
      'historical_context',         // Discorda do contexto histórico
      'modern_translation',         // Discorda da tradução moderna
      'practical_meaning',          // Discorda do significado prático
      'modern_application',         // Discorda da aplicação moderna
      'theological',                // Discordância teológica geral
      'language',                   // Problema de linguagem/clareza
      'factual_error',              // Erro factual na explicação
      'incomplete',                 // Explicação incompleta
      'other'                       // Outro motivo
    ),
    allowNull: false,               // Obrigatório
    defaultValue: 'theological'
  },
  
  suggested_correction: {
    type: DataTypes.TEXT,           // Sugestão de correção do usuário
    allowNull: true,                // Opcional
    validate: {
      len: [0, 2000]                // Máximo 2000 caracteres
    }
  },
  
  biblical_references: {
    type: DataTypes.JSON,           // Array de referências bíblicas de apoio
    allowNull: true,                // Opcional
    defaultValue: [],
    validate: {
      isValidReferences(value) {
        if (value && !Array.isArray(value)) {
          throw new Error('Referências deve ser um array');
        }
        if (value && value.length > 10) {
          throw new Error('Máximo 10 referências permitidas');
        }
      }
    }
  },
  
  // === STATUS DA DISCORDÂNCIA ===
  status: {
    type: DataTypes.ENUM(
      'pending',                    // Pendente de revisão
      'under_review',               // Sendo analisada pelo admin
      'accepted',                   // Discordância aceita - post será corrigido
      'partially_accepted',         // Parcialmente aceita - correções menores
      'rejected',                   // Discordância rejeitada - explicação mantida
      'requires_clarification'      // Precisa de mais informações do usuário
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  
  // === RESPOSTA DO ADMIN ===
  admin_response: {
    type: DataTypes.TEXT,           // Resposta detalhada do admin/pastor
    allowNull: true,                // Preenchida quando revisada
    validate: {
      len: [0, 2000]                // Máximo 2000 caracteres
    }
  },
  
  internal_notes: {
    type: DataTypes.TEXT,           // Notas internas para outros admins
    allowNull: true,                // Opcional
    validate: {
      len: [0, 1000]                // Máximo 1000 caracteres
    }
  },
  
  // === QUEM REVISOU ===
  reviewed_by: {
    type: DataTypes.UUID,           // ID do admin/pastor que revisou
    allowNull: true,                // Preenchido quando revisada
    references: {
      model: 'users',               // Referencia tabela users
      key: 'id'
    }
  },
  
  reviewed_at: {
    type: DataTypes.DATE,           // Data/hora da revisão
    allowNull: true                 // Preenchida quando revisada
  },
  
  // === DADOS CONTEXTUAIS ===
  user_spiritual_level: {
    type: DataTypes.ENUM('iniciante', 'intermediario', 'avancado'),
    allowNull: true                 // Para contexto na análise
  },
  
  user_denomination: {
    type: DataTypes.STRING(100),    // Denominação do usuário (se relevante)
    allowNull: true,                // Opcional
    validate: {
      len: [0, 100]
    }
  },
  
  // === FEEDBACK DO USUÁRIO ===
  user_satisfaction: {
    type: DataTypes.INTEGER,        // 1-5 - satisfação com a resposta
    allowNull: true,                // Preenchida após resposta
    validate: {
      min: 1,
      max: 5
    }
  },
  
  user_feedback: {
    type: DataTypes.TEXT,           // Feedback adicional do usuário
    allowNull: true,                // Opcional
    validate: {
      len: [0, 500]
    }
  },
  
  // === FLAGS DE MODERAÇÃO ===
  is_spam: {
    type: DataTypes.BOOLEAN,        // Marcada como spam?
    defaultValue: false
  },
  
  is_constructive: {
    type: DataTypes.BOOLEAN,        // Discordância construtiva?
    defaultValue: true
  },
  
  requires_theological_review: {
    type: DataTypes.BOOLEAN,        // Precisa de revisão teológica especializada?
    defaultValue: false
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'bible_disagreements',
  timestamps: true,                 // Adiciona createdAt e updatedAt
  paranoid: true,                   // Soft delete para histórico
  
  // === ÍNDICES PARA PERFORMANCE ===
  indexes: [
    {
      fields: ['user_id'],
      name: 'user_disagreements_idx'
    },
    {
      fields: ['bible_post_id'],
      name: 'post_disagreements_idx'
    },
    {
      fields: ['status'],
      name: 'disagreement_status_idx'
    },
    {
      fields: ['reviewed_by'],
      name: 'reviewed_by_idx'
    },
    {
      fields: ['priority', 'status'],
      name: 'priority_status_idx'
    },
    {
      fields: ['createdAt'],
      name: 'disagreement_date_idx'
    }
  ]
});

// === MÉTODOS ESTÁTICOS ===

// Buscar discordâncias pendentes
BibleDisagreement.findPending = async function(limit = 20) {
  return await this.findAll({
    where: {
      status: 'pending'
    },
    include: [
      {
        model: require('./User'),
        as: 'user',
        attributes: ['id', 'username', 'displayName']
      },
      {
        model: require('./BiblePost'),
        as: 'biblePost',
        attributes: ['id', 'title', 'verse_reference']
      }
    ],
    order: [
      ['priority', 'DESC'],
      ['createdAt', 'ASC']
    ],
    limit: limit
  });
};

// Estatísticas para dashboard admin
BibleDisagreement.getStats = async function() {
  const [pending, underReview, resolved, total] = await Promise.all([
    this.count({ where: { status: 'pending' } }),
    this.count({ where: { status: 'under_review' } }),
    this.count({ where: { status: ['accepted', 'partially_accepted', 'rejected'] } }),
    this.count()
  ]);
  
  return {
    pending,
    under_review: underReview,
    resolved,
    total,
    resolution_rate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
  };
};

// Buscar por admin revisor
BibleDisagreement.findByReviewer = async function(reviewerId) {
  return await this.findAll({
    where: {
      reviewed_by: reviewerId
    },
    include: [
      {
        model: require('./BiblePost'),
        as: 'biblePost',
        attributes: ['id', 'title', 'verse_reference']
      }
    ],
    order: [['reviewed_at', 'DESC']]
  });
};

// === MÉTODOS DE INSTÂNCIA ===

// Marcar como revisada
BibleDisagreement.prototype.markAsReviewed = async function(reviewerId, status, adminResponse) {
  this.status = status;
  this.reviewed_by = reviewerId;
  this.reviewed_at = new Date();
  this.admin_response = adminResponse;
  
  return await this.save();
};

// Calcular tempo de resolução
BibleDisagreement.prototype.getResolutionTime = function() {
  if (!this.reviewed_at) return null;
  
  const created = new Date(this.createdAt);
  const reviewed = new Date(this.reviewed_at);
  const diffMs = reviewed - created;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  return diffHours;
};

// Verificar se precisa de atenção urgente
BibleDisagreement.prototype.needsUrgentAttention = function() {
  const daysSinceCreated = (Date.now() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24);
  
  return (
    this.priority === 'urgent' ||
    (this.priority === 'high' && daysSinceCreated > 2) ||
    (this.status === 'pending' && daysSinceCreated > 7)
  );
};

// Dados para API pública (usuário)
BibleDisagreement.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    reason: this.reason,
    description: this.description,
    disagreement_type: this.disagreement_type,
    status: this.status,
    admin_response: this.admin_response,
    reviewed_at: this.reviewed_at,
    user_satisfaction: this.user_satisfaction,
    created_at: this.createdAt,
    updated_at: this.updatedAt
  };
};

// Dados para API admin (dados completos)
BibleDisagreement.prototype.toAdminJSON = function() {
  return {
    id: this.id,
    reason: this.reason,
    description: this.description,
    disagreement_type: this.disagreement_type,
    suggested_correction: this.suggested_correction,
    biblical_references: this.biblical_references,
    status: this.status,
    priority: this.priority,
    admin_response: this.admin_response,
    internal_notes: this.internal_notes,
    reviewed_by: this.reviewed_by,
    reviewed_at: this.reviewed_at,
    user_spiritual_level: this.user_spiritual_level,
    user_denomination: this.user_denomination,
    user_satisfaction: this.user_satisfaction,
    user_feedback: this.user_feedback,
    flags: {
      is_spam: this.is_spam,
      is_constructive: this.is_constructive,
      requires_theological_review: this.requires_theological_review,
      needs_urgent_attention: this.needsUrgentAttention()
    },
    resolution_time_hours: this.getResolutionTime(),
    created_at: this.createdAt,
    updated_at: this.updatedAt
  };
};

module.exports = BibleDisagreement;