// MODELO BIBLE POST VIEW
// Define como as visualizações dos posts da Bíblia ficam salvos

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BiblePostView = sequelize.define('BiblePostView', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === RELACIONAMENTOS ===
  user_id: {
    type: DataTypes.UUID,           // ID do usuário (null para anônimos)
    allowNull: true,                // Opcional (pode ser usuário anônimo)
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
  
  // === DADOS DA VISUALIZAÇÃO ===
  viewed_at: {
    type: DataTypes.DATE,           // Data/hora exata da visualização
    allowNull: false,               // Obrigatório
    defaultValue: DataTypes.NOW
  },
  
  time_spent: {
    type: DataTypes.INTEGER,        // Segundos que ficou visualizando
    allowNull: true,                // Opcional (pode não ter medido)
    validate: { 
      min: 0,
      max: 3600                     // Máximo 1 hora por visualização
    }
  },
  
  completed_reading: {
    type: DataTypes.BOOLEAN,        // Leu até o final do post?
    allowNull: false,               // Obrigatório
    defaultValue: false
  },
  
  reading_progress: {
    type: DataTypes.FLOAT,          // % do post que leu (0.0 a 1.0)
    allowNull: true,                // Opcional
    validate: { 
      min: 0.0,
      max: 1.0
    }
  },
  
  // === CONTEXTO DA VISUALIZAÇÃO ===
  view_source: {
    type: DataTypes.ENUM(
      'feed',                       // Via feed principal
      'search',                     // Via busca
      'profile',                    // Via perfil (amém/ops)
      'direct_link',                // Link direto
      'notification',               // Via notificação
      'share',                      // Via compartilhamento
      'category_browse',            // Navegando por categoria
      'related_posts',              // Posts relacionados
      'admin_preview'               // Preview do admin
    ),
    allowNull: false,               // Obrigatório
    defaultValue: 'feed'
  },
  
  referrer_url: {
    type: DataTypes.STRING(500),    // URL de onde veio
    allowNull: true                 // Opcional
  },
  
  // === DADOS TÉCNICOS ===
  user_agent: {
    type: DataTypes.STRING(500),    // Browser/dispositivo usado
    allowNull: true                 // Opcional
  },
  
  ip_address: {
    type: DataTypes.STRING(45),     // IP do usuário (IPv4 ou IPv6)
    allowNull: true,                // Opcional
    validate: {
      isIP: true                    // Validação de formato IP
    }
  },
  
  device_type: {
    type: DataTypes.ENUM('desktop', 'mobile', 'tablet', 'unknown'),
    allowNull: true,                // Calculado do user_agent
    defaultValue: 'unknown'
  },
  
  // === INTERAÇÕES DURANTE A VISUALIZAÇÃO ===
  scrolled_to_bottom: {
    type: DataTypes.BOOLEAN,        // Fez scroll até o final?
    allowNull: false,
    defaultValue: false
  },
  
  sections_viewed: {
    type: DataTypes.JSON,           // Quais seções foram visualizadas
    allowNull: true,                // Opcional
    defaultValue: [],
    // Exemplo: ["historical_context", "modern_translation", "practical_meaning"]
  },
  
  interactions_during_view: {
    type: DataTypes.JSON,           // Interações feitas durante a visualização
    allowNull: true,                // Opcional
    defaultValue: [],
    // Exemplo: ["like", "amen", "comment"]
  },
  
  // === DADOS PARA ALGORITMO ===
  engagement_score: {
    type: DataTypes.FLOAT,          // Score calculado de engajamento
    allowNull: true,                // Calculado automaticamente
    validate: { min: 0.0, max: 1.0 }
  },
  
  return_visitor: {
    type: DataTypes.BOOLEAN,        // Já visitou este post antes?
    allowNull: false,
    defaultValue: false
  },
  
  session_id: {
    type: DataTypes.STRING(100),    // ID da sessão de navegação
    allowNull: true                 // Para agrupar visualizações da mesma sessão
  },
  
  // === CONTEXTO TEMPORAL ===
  time_of_day: {
    type: DataTypes.TIME,           // Horário da visualização
    allowNull: true                 // Extraído do viewed_at
  },
  
  day_of_week: {
    type: DataTypes.INTEGER,        // 0-6 (Domingo=0)
    allowNull: true,                // Calculado automaticamente
    validate: { min: 0, max: 6 }
  },
  
  // === QUALIDADE DA VISUALIZAÇÃO ===
  quality_indicators: {
    type: DataTypes.JSON,           // Indicadores de qualidade da leitura
    allowNull: true,
    defaultValue: {},
    // Exemplo: { "slow_reading": true, "paused_reading": false, "came_back": true }
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'bible_post_views',
  timestamps: true,                 // Adiciona createdAt e updatedAt
  paranoid: false,                  // Não usar soft delete (queremos histórico completo)
  
  // === HOOKS AUTOMÁTICOS ===
  hooks: {
    // Antes de criar, calcula campos automáticos
    beforeCreate: async (viewRecord) => {
      const viewDate = new Date(viewRecord.viewed_at);
      
      // Extrai horário
      viewRecord.time_of_day = viewDate.toTimeString().split(' ')[0];
      
      // Calcula day_of_week
      viewRecord.day_of_week = viewDate.getDay();
      
      // Calcula engagement_score básico
      viewRecord.engagement_score = calculateEngagementScore(viewRecord);
      
      // Verifica se é return visitor
      if (viewRecord.user_id) {
        const previousView = await BiblePostView.findOne({
          where: {
            user_id: viewRecord.user_id,
            bible_post_id: viewRecord.bible_post_id,
            id: { [sequelize.Op.ne]: viewRecord.id }
          }
        });
        viewRecord.return_visitor = !!previousView;
      }
    },
    
    // Depois de criar, atualiza contador no post
    afterCreate: async (viewRecord) => {
      const BiblePost = require('./BiblePost');
      await BiblePost.increment('views_count', {
        where: { id: viewRecord.bible_post_id }
      });
    }
  },
  
  // === ÍNDICES PARA PERFORMANCE ===
  indexes: [
    {
      fields: ['user_id'],
      name: 'user_views_idx'
    },
    {
      fields: ['bible_post_id'],
      name: 'post_views_idx'
    },
    {
      fields: ['viewed_at'],
      name: 'view_date_idx'
    },
    {
      fields: ['user_id', 'bible_post_id'],
      name: 'user_post_views_idx'
    },
    {
      fields: ['view_source'],
      name: 'view_source_idx'
    },
    {
      fields: ['completed_reading'],
      name: 'completed_reading_idx'
    },
    {
      fields: ['engagement_score'],
      name: 'engagement_score_idx'
    }
  ]
});

// === FUNÇÕES AUXILIARES ===

// Calcula score de engajamento baseado nos dados da visualização
function calculateEngagementScore(viewRecord) {
  let score = 0.1; // Score base
  
  // Tempo gasto (máx 0.3)
  if (viewRecord.time_spent) {
    if (viewRecord.time_spent >= 120) score += 0.3;       // 2+ minutos
    else if (viewRecord.time_spent >= 60) score += 0.2;   // 1+ minuto
    else if (viewRecord.time_spent >= 30) score += 0.1;   // 30+ segundos
  }
  
  // Progresso de leitura (máx 0.3)
  if (viewRecord.reading_progress) {
    score += viewRecord.reading_progress * 0.3;
  }
  
  // Leu até o final (0.2)
  if (viewRecord.completed_reading) {
    score += 0.2;
  }
  
  // Fez scroll até o final (0.1)
  if (viewRecord.scrolled_to_bottom) {
    score += 0.1;
  }
  
  // Seções visualizadas (máx 0.1)
  if (viewRecord.sections_viewed && viewRecord.sections_viewed.length > 0) {
    score += Math.min(viewRecord.sections_viewed.length * 0.02, 0.1);
  }
  
  // Garantir que está entre 0 e 1
  return Math.min(Math.max(score, 0), 1);
}

// === MÉTODOS ESTÁTICOS ===

// Buscar visualizações de um usuário
BiblePostView.findUserViews = async function(userId, limit = 50) {
  return await this.findAll({
    where: {
      user_id: userId
    },
    include: [{
      model: require('./BiblePost'),
      as: 'biblePost',
      attributes: ['id', 'title', 'verse_reference', 'category']
    }],
    order: [['viewed_at', 'DESC']],
    limit: limit
  });
};

// Posts mais visualizados
BiblePostView.getMostViewedPosts = async function(period = 'week', limit = 10) {
  let whereClause = {};
  
  if (period === 'week') {
    whereClause.viewed_at = {
      [sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    };
  } else if (period === 'month') {
    whereClause.viewed_at = {
      [sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    };
  }
  
  return await this.findAll({
    attributes: [
      'bible_post_id',
      [sequelize.fn('COUNT', sequelize.col('id')), 'view_count'],
      [sequelize.fn('AVG', sequelize.col('time_spent')), 'avg_time_spent'],
      [sequelize.fn('AVG', sequelize.col('engagement_score')), 'avg_engagement']
    ],
    where: whereClause,
    include: [{
      model: require('./BiblePost'),
      as: 'biblePost',
      attributes: ['id', 'title', 'verse_reference']
    }],
    group: ['bible_post_id', 'biblePost.id'],
    order: [[sequelize.literal('view_count'), 'DESC']],
    limit: limit
  });
};

// Estatísticas de visualização para um post
BiblePostView.getPostViewStats = async function(biblePostId) {
  const [totalViews, uniqueUsers, avgTimeSpent, completionRate] = await Promise.all([
    this.count({ where: { bible_post_id: biblePostId } }),
    this.count({ 
      where: { bible_post_id: biblePostId },
      distinct: 'user_id'
    }),
    this.aggregate('time_spent', 'avg', { 
      where: { bible_post_id: biblePostId } 
    }),
    this.count({ 
      where: { 
        bible_post_id: biblePostId,
        completed_reading: true 
      }
    })
  ]);
  
  return {
    total_views: totalViews,
    unique_users: uniqueUsers,
    avg_time_spent: Math.round(avgTimeSpent || 0),
    completion_rate: totalViews > 0 ? Math.round((completionRate / totalViews) * 100) : 0,
    return_visitor_rate: 0 // Calculado separadamente se necessário
  };
};

// Analytics de padrões de visualização
BiblePostView.getViewingPatterns = async function(userId) {
  const views = await this.findAll({
    where: {
      user_id: userId
    },
    attributes: [
      'day_of_week',
      'time_of_day',
      'view_source',
      'engagement_score',
      'viewed_at'
    ],
    order: [['viewed_at', 'DESC']],
    limit: 100
  });
  
  // Análise de padrões
  const patterns = {
    preferred_days: {},
    preferred_times: {},
    preferred_sources: {},
    avg_engagement: 0
  };
  
  views.forEach(view => {
    // Contar dias da semana
    patterns.preferred_days[view.day_of_week] = 
      (patterns.preferred_days[view.day_of_week] || 0) + 1;
    
    // Contar fontes
    patterns.preferred_sources[view.view_source] = 
      (patterns.preferred_sources[view.view_source] || 0) + 1;
  });
  
  // Calcular engajamento médio
  const engagementScores = views
    .filter(v => v.engagement_score)
    .map(v => v.engagement_score);
    
  patterns.avg_engagement = engagementScores.length > 0
    ? engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length
    : 0;
  
  return patterns;
};

// === MÉTODOS DE INSTÂNCIA ===

// Verificar se é uma visualização de qualidade
BiblePostView.prototype.isQualityView = function() {
  return (
    this.engagement_score > 0.5 ||
    this.completed_reading ||
    (this.time_spent && this.time_spent >= 60)
  );
};

// Dados para API
BiblePostView.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    viewed_at: this.viewed_at,
    time_spent: this.time_spent,
    completed_reading: this.completed_reading,
    reading_progress: this.reading_progress,
    view_source: this.view_source,
    engagement_score: this.engagement_score,
    return_visitor: this.return_visitor,
    quality_view: this.isQualityView()
  };
};

// Dados para analytics (admin)
BiblePostView.prototype.toAnalyticsJSON = function() {
  return {
    ...this.toPublicJSON(),
    device_type: this.device_type,
    day_of_week: this.day_of_week,
    time_of_day: this.time_of_day,
    scrolled_to_bottom: this.scrolled_to_bottom,
    sections_viewed: this.sections_viewed,
    interactions_during_view: this.interactions_during_view,
    quality_indicators: this.quality_indicators
  };
};

module.exports = BiblePostView;