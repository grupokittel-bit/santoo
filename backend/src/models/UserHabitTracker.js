// MODELO USER HABIT TRACKER
// Define como o controle de hábitos espirituais dos usuários fica salvo

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserHabitTracker = sequelize.define('UserHabitTracker', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === RELACIONAMENTOS ===
  user_id: {
    type: DataTypes.UUID,           // ID do usuário
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
  
  // === TIPO DE REGISTRO DE HÁBITO ===
  habit_type: {
    type: DataTypes.ENUM(
      'amen_success',               // ✅ Usuário praticou corretamente hoje
      'amen_failed',                // ❌ Usuário errou/não praticou hoje
      'ops_to_amen',                // ✨ Usuário moveu de "Ops" para "Amém"
      'amen_to_ops',                // 😅 Usuário moveu de "Amém" para "Ops" (raro)
      'milestone',                  // 🏆 Marco importante (7 dias, 30 dias, etc)
      'reflection'                  // 💭 Reflexão/insight sobre o versículo
    ),
    allowNull: false,               // Obrigatório
    validate: {
      isIn: {
        args: [['amen_success', 'amen_failed', 'ops_to_amen', 'amen_to_ops', 'milestone', 'reflection']],
        msg: 'Tipo de hábito inválido'
      }
    }
  },
  
  // === DATA E CONTEXTO ===
  habit_date: {
    type: DataTypes.DATEONLY,       // Data específica do hábito (sem hora)
    allowNull: false,               // Obrigatório
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: true,
      notFuture(value) {
        if (new Date(value) > new Date()) {
          throw new Error('Data do hábito não pode ser futura');
        }
      }
    }
  },
  
  // === DETALHES DO HÁBITO ===
  notes: {
    type: DataTypes.TEXT,           // Reflexão/notas do usuário sobre o hábito
    allowNull: true,                // Opcional
    validate: {
      len: [0, 1000]                // Máximo 1000 caracteres
    }
  },
  
  difficulty_level: {
    type: DataTypes.INTEGER,        // 1-5 - quão difícil foi praticar hoje
    allowNull: true,                // Opcional
    validate: {
      min: 1,
      max: 5
    }
  },
  
  confidence_level: {
    type: DataTypes.INTEGER,        // 1-5 - confiança de conseguir manter
    allowNull: true,                // Opcional
    validate: {
      min: 1,
      max: 5
    }
  },
  
  // === CONTEXTO SITUACIONAL ===
  situation_context: {
    type: DataTypes.JSON,           // Contexto da situação
    allowNull: true,                // Opcional
    defaultValue: {},
    // Exemplo: { "location": "casa", "mood": "peaceful", "circumstances": "stressful_day" }
  },
  
  triggers: {
    type: DataTypes.JSON,           // O que ajudou/atrapalhou
    allowNull: true,                // Opcional
    defaultValue: [],
    // Exemplo: ["prayer", "stress", "family_support", "busy_schedule"]
  },
  
  // === MÉTRICAS DE PROGRESSO ===
  streak_count: {
    type: DataTypes.INTEGER,        // Sequência atual de sucessos
    allowNull: true,                // Calculado automaticamente
    validate: { min: 0 }
  },
  
  total_successes: {
    type: DataTypes.INTEGER,        // Total de sucessos para este post
    allowNull: true,                // Calculado automaticamente
    validate: { min: 0 }
  },
  
  total_attempts: {
    type: DataTypes.INTEGER,        // Total de tentativas para este post
    allowNull: true,                // Calculado automaticamente
    validate: { min: 0 }
  },
  
  // === GAMIFICAÇÃO ===
  points_earned: {
    type: DataTypes.INTEGER,        // Pontos ganhos por este registro
    allowNull: true,                // Calculado automaticamente
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  milestone_reached: {
    type: DataTypes.STRING(100),    // Qual marco foi atingido (se houver)
    allowNull: true,                // Opcional
    // Exemplos: "7_days_streak", "30_days_consistent", "first_success"
  },
  
  // === DADOS PARA ANALYTICS ===
  time_of_day: {
    type: DataTypes.TIME,           // Horário que praticou/falhou
    allowNull: true,                // Opcional para insights
  },
  
  day_of_week: {
    type: DataTypes.INTEGER,        // 0-6 (Domingo=0) para análise de padrões
    allowNull: true,                // Calculado automaticamente
    validate: { min: 0, max: 6 }
  },
  
  // === FEEDBACK E AVALIAÇÃO ===
  impact_rating: {
    type: DataTypes.INTEGER,        // 1-5 - impacto que teve no dia
    allowNull: true,                // Opcional
    validate: {
      min: 1,
      max: 5
    }
  },
  
  gratitude_note: {
    type: DataTypes.TEXT,           // Nota de gratidão relacionada
    allowNull: true,                // Opcional
    validate: {
      len: [0, 500]
    }
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'user_habit_tracker',
  timestamps: true,                 // Adiciona createdAt e updatedAt
  paranoid: false,                  // Não usar soft delete (queremos histórico completo)
  
  // === HOOKS AUTOMÁTICOS ===
  hooks: {
    // Antes de salvar, calcula campos automáticos
    beforeCreate: async (habitRecord) => {
      // Calcula day_of_week
      const date = new Date(habitRecord.habit_date);
      habitRecord.day_of_week = date.getDay();
      
      // Calcula pontos baseado no tipo
      habitRecord.points_earned = calculatePoints(habitRecord.habit_type);
    },
    
    // Depois de salvar, atualiza estatísticas
    afterCreate: async (habitRecord) => {
      await updateUserHabitStats(habitRecord.user_id, habitRecord.bible_post_id);
    }
  },
  
  // === ÍNDICES PARA PERFORMANCE ===
  indexes: [
    {
      fields: ['user_id', 'bible_post_id'],
      name: 'user_post_habits_idx'
    },
    {
      fields: ['user_id', 'habit_date'],
      name: 'user_date_habits_idx'
    },
    {
      fields: ['habit_type'],
      name: 'habit_type_idx'
    },
    {
      fields: ['habit_date'],
      name: 'habit_date_idx'
    },
    {
      fields: ['user_id', 'habit_type', 'habit_date'],
      name: 'user_type_date_idx'
    }
  ]
});

// === FUNÇÕES AUXILIARES ===

// Calcula pontos baseado no tipo de hábito
function calculatePoints(habitType) {
  const pointsMap = {
    'amen_success': 10,      // Sucesso vale mais
    'amen_failed': 2,        // Falha ainda vale algo (honestidade)
    'ops_to_amen': 25,       // Evolução vale muito
    'amen_to_ops': 5,        // Regredir vale menos mas é honesto
    'milestone': 50,         // Marcos valem muito
    'reflection': 15         // Reflexões valem bem
  };
  
  return pointsMap[habitType] || 0;
}

// Atualiza estatísticas do usuário para um post específico
async function updateUserHabitStats(userId, biblePostId) {
  // Busca todos os registros do usuário para este post
  const records = await UserHabitTracker.findAll({
    where: {
      user_id: userId,
      bible_post_id: biblePostId
    },
    order: [['habit_date', 'ASC']]
  });
  
  // Calcula estatísticas
  let totalSuccesses = 0;
  let totalAttempts = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  
  records.forEach(record => {
    if (record.habit_type === 'amen_success') {
      totalSuccesses++;
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else if (record.habit_type === 'amen_failed') {
      tempStreak = 0;
    }
    
    if (['amen_success', 'amen_failed'].includes(record.habit_type)) {
      totalAttempts++;
    }
  });
  
  // Calcula streak atual (últimos registros consecutivos de sucesso)
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].habit_type === 'amen_success') {
      currentStreak++;
    } else if (records[i].habit_type === 'amen_failed') {
      break;
    }
  }
  
  // Atualiza o último registro com as estatísticas
  if (records.length > 0) {
    const lastRecord = records[records.length - 1];
    await lastRecord.update({
      streak_count: currentStreak,
      total_successes: totalSuccesses,
      total_attempts: totalAttempts
    });
  }
}

// === MÉTODOS ESTÁTICOS ===

// Busca hábitos de um usuário para um post específico
UserHabitTracker.findUserPostHabits = async function(userId, biblePostId, limit = 30) {
  return await this.findAll({
    where: {
      user_id: userId,
      bible_post_id: biblePostId
    },
    order: [['habit_date', 'DESC']],
    limit: limit
  });
};

// Estatísticas de hábitos de um usuário
UserHabitTracker.getUserHabitStats = async function(userId) {
  const stats = await this.findAll({
    attributes: [
      'bible_post_id',
      [sequelize.fn('MAX', sequelize.col('streak_count')), 'max_streak'],
      [sequelize.fn('MAX', sequelize.col('total_successes')), 'total_successes'],
      [sequelize.fn('MAX', sequelize.col('total_attempts')), 'total_attempts'],
      [sequelize.fn('SUM', sequelize.col('points_earned')), 'total_points']
    ],
    where: {
      user_id: userId
    },
    group: ['bible_post_id']
  });
  
  return stats;
};

// Hábitos de hoje para um usuário
UserHabitTracker.getTodayHabits = async function(userId) {
  const today = new Date().toISOString().split('T')[0];
  
  return await this.findAll({
    where: {
      user_id: userId,
      habit_date: today
    },
    include: [{
      model: require('./BiblePost'),
      as: 'biblePost',
      attributes: ['id', 'title', 'verse_reference']
    }],
    order: [['createdAt', 'DESC']]
  });
};

// Streak mais longo de um usuário
UserHabitTracker.getUserMaxStreak = async function(userId) {
  const result = await this.findOne({
    attributes: [
      [sequelize.fn('MAX', sequelize.col('streak_count')), 'max_streak']
    ],
    where: {
      user_id: userId
    }
  });
  
  return result ? result.getDataValue('max_streak') || 0 : 0;
};

// === MÉTODOS DE INSTÂNCIA ===

// Verificar se é um marco
UserHabitTracker.prototype.checkMilestone = function() {
  const milestones = [
    { days: 1, name: 'first_success' },
    { days: 3, name: '3_days_streak' },
    { days: 7, name: '7_days_streak' },
    { days: 14, name: '2_weeks_streak' },
    { days: 30, name: '30_days_streak' },
    { days: 60, name: '2_months_streak' },
    { days: 100, name: '100_days_streak' },
    { days: 365, name: 'one_year_streak' }
  ];
  
  return milestones.find(milestone => 
    this.streak_count === milestone.days
  );
};

// Calcular taxa de sucesso
UserHabitTracker.prototype.getSuccessRate = function() {
  if (!this.total_attempts || this.total_attempts === 0) return 0;
  return Math.round((this.total_successes / this.total_attempts) * 100);
};

// Dados para API
UserHabitTracker.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    habit_type: this.habit_type,
    habit_date: this.habit_date,
    notes: this.notes,
    difficulty_level: this.difficulty_level,
    confidence_level: this.confidence_level,
    impact_rating: this.impact_rating,
    streak_count: this.streak_count,
    total_successes: this.total_successes,
    total_attempts: this.total_attempts,
    success_rate: this.getSuccessRate(),
    points_earned: this.points_earned,
    milestone_reached: this.milestone_reached,
    gratitude_note: this.gratitude_note,
    created_at: this.createdAt
  };
};

module.exports = UserHabitTracker;